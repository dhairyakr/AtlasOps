import React, { useState } from 'react';
import { X, Check, User } from 'lucide-react';
import { PERSONAS, Persona, getPersonaById } from '../utils/personas';
import { useTheme } from '../contexts/ThemeContext';

interface PersonaSelectorProps {
  currentPersonaId: string;
  onPersonaChange: (personaId: string) => void;
  onClose: () => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  currentPersonaId,
  onPersonaChange,
  onClose
}) => {
  const { theme } = useTheme();
  const [selectedPersonaId, setSelectedPersonaId] = useState(currentPersonaId);
  const [isButtonClicked, setIsButtonClicked] = useState<string | null>(null);
  const currentPersona = getPersonaById(currentPersonaId);

  const handleClick = (buttonId: string, action: () => void) => {
    setIsButtonClicked(buttonId);
    action();
    setTimeout(() => setIsButtonClicked(null), 300);
  };

  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersonaId(personaId);
  };

  const handleSave = () => {
    onPersonaChange(selectedPersonaId);
    onClose();
  };

  const handleCancel = () => {
    setSelectedPersonaId(currentPersonaId);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-premium rounded-2xl shadow-cosmic-glow border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in relative">
          {/* Liquid gradient overlay */}
          <div className="liquid-gradient-overlay rounded-2xl"></div>
          
          {/* Reflection effect */}
          <div className="reflection-effect rounded-2xl"></div>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-cosmic-glow icon-depth">
                <User className="w-5 h-5 text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text">Choose AI Persona</h2>
                <p className="text-sm text-white/70">
                  Current: {currentPersona?.name || 'Default Assistant'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleClick('close-modal', handleCancel)}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift btn-interactive-effect shadow-neural-glow ${isButtonClicked === 'close-modal' ? 'clicked' : ''}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] hide-scrollbar relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERSONAS.map((persona) => {
                const isSelected = selectedPersonaId === persona.id;
                const isCurrent = currentPersonaId === persona.id;
                
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleClick(`persona-${persona.id}`, () => handlePersonaSelect(persona.id))}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-500 transform hover:scale-105 btn-hover-lift text-left btn-interactive-effect overflow-hidden ${isButtonClicked === `persona-${persona.id}` ? 'clicked' : ''} ${
                      isSelected
                        ? 'border-neo-tech-quantum-cyan/50 bg-white/10 shadow-cosmic-glow'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 hover:shadow-neural-glow'
                    }`}
                  >
                    {/* Animated border for selected card */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl pointer-events-none animated-border-glow"></div>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-neo-tech-quantum-cyan rounded-full flex items-center justify-center animate-bounce-in shadow-cosmic-glow z-20">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Current indicator */}
                    {isCurrent && !isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-neo-tech-aurora-pink rounded-full flex items-center justify-center shadow-neural-glow z-20">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}

                    {/* Persona icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 bg-gradient-to-r ${persona.color} shadow-lg icon-depth relative z-10`}>
                      <span className="relative z-10">{persona.icon}</span>
                    </div>

                    {/* Persona info */}
                    <div className="relative z-10">
                      <h3 className={`font-semibold text-lg mb-2 ${
                        isSelected 
                          ? 'text-white' 
                          : 'text-white/90'
                      }`}>
                        {persona.name}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-neo-tech-aurora-pink/20 text-neo-tech-aurora-pink px-2 py-1 rounded-full backdrop-blur-sm">
                            Current
                          </span>
                        )}
                      </h3>
                      <p className={`text-sm ${
                        isSelected 
                          ? 'text-white/80' 
                          : 'text-white/60'
                      }`}>
                        {persona.description}
                      </p>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                );
              })}
            </div>

            {/* Selected persona preview */}
            {selectedPersonaId !== currentPersonaId && (
              <div className="mt-6 p-4 glass-premium rounded-xl border border-neo-tech-quantum-cyan/30 animate-slide-up shadow-cosmic-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-neo-tech-quantum-cyan/10 to-neo-tech-plasma-blue/10 rounded-xl"></div>
                <h4 className="font-semibold text-white mb-2 relative z-10">
                  Preview: {getPersonaById(selectedPersonaId)?.name}
                </h4>
                <p className="text-sm text-white/80 relative z-10">
                  {getPersonaById(selectedPersonaId)?.description}
                </p>
                {getPersonaById(selectedPersonaId)?.instruction && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm relative z-10">
                    <p className="text-xs text-white/70 font-medium mb-1">
                      How this persona will respond:
                    </p>
                    <p className="text-xs text-white/60 line-clamp-3">
                      {getPersonaById(selectedPersonaId)?.instruction.substring(0, 200)}...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Persona comparison examples */}
            <div className="mt-6 p-4 glass-premium rounded-xl border border-neo-tech-neon-violet/30 shadow-neural-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-neo-tech-neon-violet/10 to-neo-tech-aurora-pink/10 rounded-xl"></div>
              <h4 className="font-semibold text-white mb-3 relative z-10">
                💡 Persona Examples
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm relative z-10">
                <div className="space-y-2">
                  <div className="font-medium text-neo-tech-quantum-cyan">Default Assistant:</div>
                  <div className="text-white/80">
                    "I can help you with a wide range of tasks. What would you like to know?"
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-neo-tech-quantum-cyan">Creative Muse:</div>
                  <div className="text-white/80">
                    "Let's paint the canvas of possibility with vibrant ideas! What creative adventure shall we embark upon today?"
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5 backdrop-blur-sm relative z-10">
            <div className="text-sm text-white/60">
              Choose a persona to customize how the AI responds to your messages
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleClick('cancel-button', handleCancel)}
                className={`px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift btn-interactive-effect shadow-neural-glow ${isButtonClicked === 'cancel-button' ? 'clicked' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleClick('apply-persona', handleSave)}
                disabled={selectedPersonaId === currentPersonaId}
                className={`px-6 py-2 bg-gradient-to-r from-neo-tech-quantum-cyan to-neo-tech-plasma-blue text-white rounded-lg hover:from-neo-tech-quantum-cyan/80 hover:to-neo-tech-plasma-blue/80 focus:ring-4 focus:ring-neo-tech-quantum-cyan/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed btn-hover-lift shadow-cosmic-glow btn-interactive-effect relative overflow-hidden ${isButtonClicked === 'apply-persona' ? 'clicked' : ''}`}
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 animate-shimmer-light opacity-0 hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10">
                  {selectedPersonaId === currentPersonaId ? 'No Change' : 'Apply Persona'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};