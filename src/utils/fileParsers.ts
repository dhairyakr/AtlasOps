import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import parsePptxFile from 'pptx-parser';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export class FileParsingError extends Error {
  constructor(
    message: string,
    public errorType: 'corrupted' | 'password-protected' | 'unsupported' | 'low-quality' | 'network' | 'general',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FileParsingError';
  }
}

export interface ParsedFileContent {
  text: string;
  metadata?: {
    pageCount?: number;
    sheetCount?: number;
    slideCount?: number;
    wordCount?: number;
    quality?: 'high' | 'medium' | 'low';
    confidence?: number;
    ocrUsed?: boolean;
    ocrPages?: number;
  };
  base64Content?: string;
  mimeType?: string;
}

export async function parseImage(file: File): Promise<ParsedFileContent> {
  try {
    if (!file.type.startsWith('image/')) {
      throw new FileParsingError('Invalid image format. Please upload a valid image file.', 'unsupported');
    }
    if (file.size < 100) {
      throw new FileParsingError('Image file appears to be corrupted or empty.', 'corrupted');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) {
          reject(new FileParsingError('Failed to read image file.', 'corrupted'));
          return;
        }
        const base64Data = result.split(',')[1];
        if (!base64Data || base64Data.length < 100) {
          reject(new FileParsingError('Image file appears to be corrupted or invalid.', 'corrupted'));
          return;
        }
        resolve({
          text: `Image uploaded: ${file.name} (${formatFileSize(file.size)})`,
          base64Content: base64Data,
          mimeType: file.type,
          metadata: {
            wordCount: 0,
            quality: file.size > 1024 * 1024 ? 'high' : file.size > 512 * 1024 ? 'medium' : 'low',
            confidence: file.size > 1024 * 1024 ? 0.9 : file.size > 512 * 1024 ? 0.7 : 0.5,
          },
        });
      };
      reader.onerror = () => {
        reject(new FileParsingError('Failed to read image file.', 'corrupted'));
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    if (error instanceof FileParsingError) throw error;
    throw new FileParsingError('Failed to process image file.', 'general', error instanceof Error ? error : undefined);
  }
}

async function renderPdfPageToBase64(page: pdfjsLib.PDFPageProxy): Promise<string> {
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return dataUrl.split(',')[1];
}

async function visionOcrPage(
  pageBase64: string,
  apiKey: string,
  pageNum: number
): Promise<string> {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `You are a precise OCR engine. Extract ALL text visible in this document page image. Preserve the logical reading order (top to bottom, left to right). Include headings, body text, captions, labels, table contents, and any other visible text. Output ONLY the extracted text with no explanations, no prefixes, no markdown formatting. Page ${pageNum}:`
          },
          {
            inlineData: { mimeType: 'image/jpeg', data: pageBase64 }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 }
      },
    }),
  });
  if (!response.ok) return '';
  const data = await response.json();
  const candidate = data?.candidates?.[0];
  if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    return '';
  }
  return candidate.content.parts[0].text ?? '';
}

export async function parsePdf(
  arrayBuffer: ArrayBuffer,
  apiKey?: string
): Promise<ParsedFileContent> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    if (
      uint8Array.length < 4 ||
      !(uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46)
    ) {
      throw new FileParsingError('Invalid PDF file format. The file may be corrupted or not a valid PDF.', 'corrupted');
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pdf.isEncrypted) {
      throw new FileParsingError(
        'This PDF is password-protected. Please remove the password or upload an unprotected version.',
        'password-protected'
      );
    }

    const numPages = pdf.numPages;
    if (numPages === 0) {
      throw new FileParsingError('PDF file appears to be empty or corrupted.', 'corrupted');
    }

    let fullText = '';
    let totalTextLength = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `Page ${pageNum}:\n${pageText}\n\n`;
        totalTextLength += pageText.length;
      } catch {
        fullText += `Page ${pageNum}: [Text extraction failed]\n\n`;
      }
    }

    if (totalTextLength >= 50) {
      const quality: 'high' | 'medium' | 'low' =
        totalTextLength > 1000 ? 'high' : totalTextLength > 200 ? 'medium' : 'low';
      return {
        text: fullText.trim(),
        metadata: {
          pageCount: numPages,
          wordCount: fullText.split(/\s+/).length,
          quality,
          confidence: quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5,
          ocrUsed: false,
        },
      };
    }

    if (!apiKey) {
      throw new FileParsingError(
        'This PDF appears to be image-based. Provide a Gemini API key to enable Vision OCR for automatic text extraction.',
        'low-quality'
      );
    }

    let ocrText = '';
    let ocrPagesSucceeded = 0;
    const maxOcrPages = Math.min(numPages, 15);

    for (let pageNum = 1; pageNum <= maxOcrPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const pageBase64 = await renderPdfPageToBase64(page);
        const extracted = await visionOcrPage(pageBase64, apiKey, pageNum);
        if (extracted.trim()) {
          ocrText += `Page ${pageNum}:\n${extracted.trim()}\n\n`;
          ocrPagesSucceeded++;
        } else {
          ocrText += `Page ${pageNum}: [No text detected]\n\n`;
        }
      } catch {
        ocrText += `Page ${pageNum}: [OCR failed]\n\n`;
      }
    }

    const ocrTextLength = ocrText.replace(/Page \d+:\s*\[.*?\]\s*/g, '').trim().length;

    if (ocrTextLength < 30) {
      throw new FileParsingError(
        'Could not extract readable text from this PDF even with Vision OCR. The document may contain no text, be heavily obscured, or be of very low quality.',
        'low-quality'
      );
    }

    const quality: 'high' | 'medium' | 'low' =
      ocrTextLength > 1000 ? 'high' : ocrTextLength > 200 ? 'medium' : 'low';

    return {
      text: ocrText.trim(),
      metadata: {
        pageCount: numPages,
        wordCount: ocrText.split(/\s+/).length,
        quality,
        confidence: quality === 'high' ? 0.85 : quality === 'medium' ? 0.65 : 0.45,
        ocrUsed: true,
        ocrPages: ocrPagesSucceeded,
      },
    };
  } catch (error) {
    if (error instanceof FileParsingError) throw error;
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF structure') || error.message.includes('PDF header')) {
        throw new FileParsingError('Invalid PDF file structure. The file may be corrupted.', 'corrupted', error);
      }
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new FileParsingError(
          'This PDF is password-protected. Please remove the password.',
          'password-protected',
          error
        );
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new FileParsingError('Network error while processing PDF.', 'network', error);
      }
    }
    throw new FileParsingError(
      'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
      'general',
      error instanceof Error ? error : undefined
    );
  }
}

export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<ParsedFileContent> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    if (uint8Array.length < 4 || uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      throw new FileParsingError('Invalid DOCX file format.', 'corrupted');
    }

    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    if (
      !text &&
      result.messages.some(
        msg =>
          msg.message.toLowerCase().includes('password') ||
          msg.message.toLowerCase().includes('encrypted') ||
          msg.message.toLowerCase().includes('protected')
      )
    ) {
      throw new FileParsingError(
        'This Word document is password-protected.',
        'password-protected'
      );
    }

    if (text.trim().length < 10) {
      throw new FileParsingError(
        'Could not extract readable text from this Word document. The document may be empty or contain only images.',
        'low-quality'
      );
    }

    const hasWarnings = result.messages.some(msg => msg.type === 'warning');
    const quality: 'high' | 'medium' | 'low' =
      !hasWarnings && text.length > 1000 ? 'high' : text.length > 200 ? 'medium' : 'low';

    return {
      text: text.trim(),
      metadata: {
        wordCount: text.split(/\s+/).length,
        quality,
        confidence: quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5,
      },
    };
  } catch (error) {
    if (error instanceof FileParsingError) throw error;
    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes('password') ||
        error.message.toLowerCase().includes('encrypted')
      ) {
        throw new FileParsingError('This Word document is password-protected.', 'password-protected', error);
      }
    }
    throw new FileParsingError(
      'Failed to parse Word document.',
      'general',
      error instanceof Error ? error : undefined
    );
  }
}

export async function parseXlsx(arrayBuffer: ArrayBuffer): Promise<ParsedFileContent> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    if (uint8Array.length < 4 || uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      throw new FileParsingError('Invalid Excel file format.', 'corrupted');
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    if (!workbook?.SheetNames?.length) {
      throw new FileParsingError('Excel file appears to be empty or corrupted.', 'corrupted');
    }

    const sheetNames = workbook.SheetNames;
    let fullText = '';
    let totalCells = 0;

    sheetNames.forEach((sheetName, index) => {
      try {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          fullText += `Sheet ${index + 1}: ${sheetName} [Empty]\n`;
          return;
        }
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        fullText += `Sheet ${index + 1}: ${sheetName}\n`;
        (sheetData as any[][]).forEach((row, rowIndex) => {
          if (row.length > 0) {
            const rowText = row
              .filter(cell => cell !== null && cell !== undefined && cell !== '')
              .join(' | ');
            if (rowText.trim()) {
              fullText += `Row ${rowIndex + 1}: ${rowText}\n`;
              totalCells += row.filter(cell => cell !== null && cell !== undefined && cell !== '').length;
            }
          }
        });
      } catch {
        fullText += `Sheet ${index + 1}: ${sheetName} [Processing failed]\n`;
      }
      fullText += '\n';
    });

    if (totalCells < 5) {
      throw new FileParsingError('Could not extract meaningful data from this Excel file.', 'low-quality');
    }

    const quality: 'high' | 'medium' | 'low' =
      totalCells > 100 ? 'high' : totalCells > 20 ? 'medium' : 'low';

    return {
      text: fullText.trim(),
      metadata: {
        sheetCount: sheetNames.length,
        wordCount: fullText.split(/\s+/).length,
        quality,
        confidence: quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5,
      },
    };
  } catch (error) {
    if (error instanceof FileParsingError) throw error;
    throw new FileParsingError(
      'Failed to parse Excel file.',
      'general',
      error instanceof Error ? error : undefined
    );
  }
}

export async function parsePptx(file: File): Promise<ParsedFileContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    if (uint8Array.length < 4 || uint8Array[0] !== 0x50 || uint8Array[1] !== 0x4B) {
      throw new FileParsingError('Invalid PowerPoint file format.', 'corrupted');
    }

    const pptxData = await parsePptxFile(file);
    let fullText = '';
    let slideCount = 0;
    let totalTextLength = 0;

    const extractTextRecursively = (obj: any, depth = 0): string => {
      let text = '';
      if (depth > 10) return text;
      if (typeof obj === 'string' && obj.trim().length > 0) return obj.trim() + ' ';
      if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
          obj.forEach((item: any) => { text += extractTextRecursively(item, depth + 1); });
        } else {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const value = obj[key];
              if (typeof value === 'string' && value.trim().length > 0) {
                text += value.trim() + ' ';
              } else if (typeof value === 'object' && value !== null) {
                text += extractTextRecursively(value, depth + 1);
              }
            }
          }
        }
      }
      return text;
    };

    if (pptxData?.slides && Array.isArray(pptxData.slides)) {
      pptxData.slides.forEach((slide: any, index: number) => {
        slideCount++;
        const slideText = extractTextRecursively(slide);
        if (slideText.trim()) {
          fullText += `Slide ${index + 1}:\n${slideText.trim()}\n\n`;
          totalTextLength += slideText.trim().length;
        } else {
          fullText += `Slide ${index + 1}: [No text content detected]\n\n`;
        }
      });
    } else {
      throw new FileParsingError(
        'Could not access slides in this PowerPoint file.',
        'corrupted'
      );
    }

    if (totalTextLength < 10 && pptxData) {
      const extracted = extractTextRecursively(pptxData);
      if (extracted.trim()) {
        fullText = `Document content:\n${extracted.trim()}`;
        slideCount = slideCount || 1;
        totalTextLength = extracted.trim().length;
      }
    }

    const cleanedText = fullText.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    const meaningfulContent = cleanedText
      .replace(/Slide \d+:\s*/g, '')
      .replace(/\[No text content detected\]/g, '')
      .trim();

    if (meaningfulContent.length < 10) {
      throw new FileParsingError(
        'Could not extract readable text from this PowerPoint file. The presentation may contain primarily visual content.',
        'low-quality'
      );
    }

    const quality: 'high' | 'medium' | 'low' =
      totalTextLength > 500 ? 'high' : totalTextLength > 100 ? 'medium' : 'low';

    return {
      text: cleanedText,
      metadata: {
        slideCount,
        wordCount: meaningfulContent.split(/\s+/).filter(w => w.length > 0).length,
        quality,
        confidence: quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5,
      },
    };
  } catch (error) {
    if (error instanceof FileParsingError) throw error;
    throw new FileParsingError(
      'Failed to parse PowerPoint file.',
      'general',
      error instanceof Error ? error : undefined
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function parseFileContent(file: File, apiKey?: string): Promise<ParsedFileContent> {
  const isImage = file.type.startsWith('image/');
  const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

  if (file.size > maxSize) {
    const sizeLimit = isImage ? '10MB' : '50MB';
    throw new FileParsingError(
      `File size too large (${formatFileSize(file.size)}). Please select a file smaller than ${sizeLimit}.`,
      'unsupported'
    );
  }

  if (file.size === 0) {
    throw new FileParsingError('File is empty. Please select a valid file.', 'corrupted');
  }

  if (file.size < 10) {
    throw new FileParsingError('File is too small to contain meaningful content.', 'corrupted');
  }

  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split('.').pop();

  try {
    if (mimeType.startsWith('image/')) {
      return await parseImage(file);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      extension === 'pptx'
    ) {
      return await parsePptx(file);
    }

    const arrayBuffer = await file.arrayBuffer();

    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return await parsePdf(arrayBuffer, apiKey);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      return await parseDocx(arrayBuffer);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      extension === 'xlsx'
    ) {
      return await parseXlsx(arrayBuffer);
    }

    try {
      const textContent = await file.text();
      if (textContent.trim().length === 0) {
        throw new FileParsingError('Text file is empty or contains no readable content.', 'low-quality');
      }
      const quality: 'high' | 'medium' | 'low' =
        textContent.length > 1000 ? 'high' : textContent.length > 200 ? 'medium' : 'low';
      return {
        text: textContent,
        metadata: {
          wordCount: textContent.split(/\s+/).length,
          quality,
          confidence: quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5,
        },
      };
    } catch (textError) {
      if (textError instanceof FileParsingError) throw textError;
      throw new FileParsingError(
        'Failed to read text file.',
        'corrupted',
        textError instanceof Error ? textError : undefined
      );
    }
  } catch (error) {
    if (error instanceof FileParsingError) throw error;
    throw new FileParsingError(
      'An unexpected error occurred while parsing the file.',
      'general',
      error instanceof Error ? error : undefined
    );
  }
}

export function getErrorMessage(error: FileParsingError): string {
  const icons: Record<string, string> = {
    'password-protected': 'Password protected',
    corrupted: 'File corrupted',
    'low-quality': 'Low quality',
    unsupported: 'Unsupported format',
    network: 'Network error',
    general: 'Error',
  };
  return `${icons[error.errorType] ?? 'Error'}: ${error.message}`;
}

export function getErrorSuggestions(error: FileParsingError): string[] {
  switch (error.errorType) {
    case 'password-protected':
      return [
        'Remove the password protection from the document',
        'Save the document as an unprotected version',
        'Contact the document owner for an unprotected copy',
      ];
    case 'corrupted':
      return [
        'Try uploading a different copy of the file',
        'Check if the file opens correctly in its native application',
        'Re-download or re-export the document from its source',
      ];
    case 'low-quality':
      return [
        'Ensure your Gemini API key is entered for Vision OCR support',
        'Try a higher quality scan or image',
        'Convert the document to a text-based PDF format',
      ];
    case 'unsupported':
      return [
        'Convert the file to a supported format (PDF, DOCX, XLSX, PPTX)',
        'Check the file size and reduce if necessary',
      ];
    case 'network':
      return ['Check your internet connection', 'Try uploading the file again'];
    default:
      return ['Try uploading a different file', 'Check if the file is valid and not corrupted'];
  }
}

export function getSupportedFileTypes(): string[] {
  return [
    'text/plain', 'text/markdown', 'text/csv', 'application/json',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
  ];
}

export function isFileTypeSupported(file: File): boolean {
  const supportedTypes = getSupportedFileTypes();
  const extension = file.name.toLowerCase().split('.').pop();
  const supportedExtensions = [
    'txt', 'md', 'csv', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'xml',
    'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt',
    'pdf', 'docx', 'xlsx', 'pptx',
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
  ];
  return supportedTypes.includes(file.type.toLowerCase()) ||
    (!!extension && supportedExtensions.includes(extension));
}
