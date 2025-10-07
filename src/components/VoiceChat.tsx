'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, Users, Volume2, VolumeX, Copy, Check, Share2 } from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import VolumeSlider from './VolumeSlider';
import VoiceActivityIndicator from './VoiceActivityIndicator';
import VoiceThresholdSlider from './VoiceThresholdSlider';
import RespectedUsers from './RespectedUsers';

interface VoiceChatProps {
  roomId: string;
  username: string;
  onLeave: () => void;
}

export default function VoiceChat({ roomId, username, onLeave }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<{ id: string; username: string }[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const { isConnected, isConnecting, error, connect, disconnect, toggleMute, toggleDeafen, setParticipantVolume, toggleParticipantMute, getParticipantVolume, isParticipantMuted, isParticipantSpeaking, getParticipantAudioLevel, getLocalAudioLevel, isLocalSpeaking, getLocalThreshold, updateLocalThreshold } = useVoiceChat(roomId, username, {
    onParticipantsUpdate: (newParticipants) => {
      console.log('Participants updated:', newParticipants);
      setParticipants(newParticipants);
    },
    onError: (err) => console.error('Voice chat error:', err),
  });

  useEffect(() => {
    connect();
    return () => {
      console.log('VoiceChat component unmounting, disconnecting...');
      disconnect();
    };
  }, [roomId, username]); // Only depend on roomId and username, not the functions

  const handleMuteToggle = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const handleDeafenToggle = () => {
    toggleDeafen();
    setIsDeafened(!isDeafened);
  };

  const handleLeave = () => {
    disconnect();
    onLeave();
  };

  const handleCopyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Сброс через 2 секунды
    } catch (err) {
      console.error('Ошибка копирования:', err);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}?room=${encodeURIComponent(roomId)}`;
    
    try {
      // Пробуем использовать Web Share API если доступен
      if (navigator.share) {
        await navigator.share({
          title: `Присоединяйтесь к голосовому чату ${roomId}`,
          text: `Присоединяйтесь к голосовому чату ${roomId}`,
          url: shareUrl,
        });
      } else {
        // Fallback - копируем ссылку в буфер обмена
        await navigator.clipboard.writeText(shareUrl);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 3000);
      }
    } catch (err) {
      console.error('Ошибка поделиться:', err);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6">
        {/* Основной контент чата */}
        <div className="flex-1">
          {/* Header */}
          <div className="minimal-card p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                 <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-semibold text-white">{roomId}</h1>
                   <div className="flex items-center gap-2">
                     <button onClick={handleCopyRoomId} className={`p-2 rounded-lg transition-all duration-200 ${isCopied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white border border-gray-600/30'}`} title={isCopied ? 'Скопировано!' : 'Копировать ID комнаты'}>
                       {isCopied ? <Check size={16} /> : <Copy size={16} />}
                     </button>
                     <button onClick={handleShareLink} className={`p-2 rounded-lg transition-all duration-200 ${isLinkCopied ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-white border border-gray-600/30'}`} title={isLinkCopied ? 'Ссылка скопирована!' : 'Поделиться ссылкой на комнату'}>
                       {isLinkCopied ? <Check size={16} /> : <Share2 size={16} />}
                     </button>
                   </div>
                 </div>
                <p className="text-gray-400 text-sm">{isConnected ? 'Подключен' : isConnecting ? 'Подключение...' : 'Отключен'}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={20} />
                  <span className="text-sm">
                    {participants.length + 1} ({participants.length} других)
                  </span>
                </div>

                <button onClick={handleLeave} className="bg-transparent border border-gray-600 hover:border-red-500 hover:text-red-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <Phone size={20} />
                  Покинуть
                </button>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="minimal-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Участники ({participants.length + 1})</h2>

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
                Отладка: найдено {participants.length} участников
                {participants.length > 0 && <div className="mt-1">{participants.map((p) => `${p.username} (${p.id})`).join(', ')}</div>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Current User */}
              <div className="bg-dark-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <VoiceActivityIndicator isActive={isLocalSpeaking()} audioLevel={getLocalAudioLevel()} size="sm" className="flex-shrink-0">
                    <div className="w-full h-full bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">{username.charAt(0).toUpperCase()}</div>
                  </VoiceActivityIndicator>
                  <div>
                    <p className="font-medium text-white">{username}</p>
                    <p className="text-sm text-gray-400">Вы {isLocalSpeaking() ? '• Говорите' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Other Participants */}
              {participants
                .filter((participant) => participant && participant.username)
                .map((participant) => (
                  <div key={participant.id} className="bg-dark-800 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <VoiceActivityIndicator isActive={isParticipantSpeaking(participant.id)} audioLevel={getParticipantAudioLevel(participant.id)} size="sm" className="flex-shrink-0">
                        <div className="w-full h-full bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm">{participant.username?.charAt(0)?.toUpperCase() || '?'}</div>
                      </VoiceActivityIndicator>
                      <div className="flex-1">
                        <p className="font-medium text-white">{participant.username || 'Unknown'}</p>
                        <p className="text-sm text-gray-400">Участник {isParticipantSpeaking(participant.id) ? '• Говорит' : ''}</p>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <VolumeSlider participantId={participant.id} initialVolume={getParticipantVolume(participant.id)} onVolumeChange={setParticipantVolume} isMuted={isParticipantMuted(participant.id)} onMuteToggle={toggleParticipantMute} />
                  </div>
                ))}
            </div>
          </div>

          {/* Voice Threshold Settings */}
          <div className="minimal-card p-6 mb-6">
            <VoiceThresholdSlider threshold={getLocalThreshold()} onThresholdChange={updateLocalThreshold} currentAudioLevel={getLocalAudioLevel()} isSpeaking={isLocalSpeaking()} />
          </div>

          {/* Controls */}
          <div className="minimal-card p-6">
            <div className="flex justify-center gap-6">
              <button onClick={handleMuteToggle} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-transparent border-gray-600 hover:border-white text-white'}`}>
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button onClick={handleDeafenToggle} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 ${isDeafened ? 'bg-red-500 border-red-500 text-white' : 'bg-transparent border-gray-600 hover:border-white text-white'}`}>
                {isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                {isMuted ? 'Микрофон выключен' : 'Микрофон включен'} •{isDeafened ? ' Звук выключен' : ' Звук включен'}
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Блок уважаемых пользователей */}
        <div className="w-full lg:w-auto flex-shrink-0">
          <RespectedUsers />
        </div>
      </div>
    </div>
  );
}
