'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as faceapi from 'face-api.js';
import { useSupabase } from '@/app/supabase-provider';
import { Video, VideoOff, Mic, MicOff } from 'lucide-react';

type LoadingStatus = 'Initializing' | 'Loading Models' | 'Models Loaded' | 'Ready' | 'Error';

export default function GenderCheckPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('Initializing');
    const [error, setError] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isCamOn, setIsCamOn] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(true);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
    
    const router = useRouter();
    const { supabase, session } = useSupabase();

    const loadModels = useCallback(async () => {
        setLoadingStatus('Loading Models');
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
            ]);
            setLoadingStatus('Models Loaded');
        } catch (err) {
            console.error('Failed to load models:', err);
            setError('Could not load verification models. Please refresh the page.');
            setLoadingStatus('Error');
        }
    }, []);

    const getDevices = useCallback(async () => {
        try {
            // Need to get permissions first to see all devices
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevs = devices.filter(d => d.kind === 'videoinput');
            setVideoDevices(videoDevs);
            if (videoDevs.length > 0) {
                setSelectedVideoDevice(videoDevs[0].deviceId);
            }
        } catch (err) {
            console.error('Failed to get media devices:', err);
             setError('Could not access media devices. Please enable camera and microphone permissions.');
        }
    }, []);

    useEffect(() => {
        loadModels();
    }, [loadModels]);

    useEffect(() => {
        if(loadingStatus === 'Models Loaded'){
            getDevices().then(() => {
                setLoadingStatus('Ready');
            });
        }
    }, [loadingStatus, getDevices]);

    const startStopCamera = async () => {
        if (isCamOn) {
            // Stop camera
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            videoRef.current!.srcObject = null;
            setIsCamOn(false);
        } else {
            // Start camera
            if (!selectedVideoDevice) {
                setError("No camera selected.");
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { deviceId: { exact: selectedVideoDevice } },
                    audio: true 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Mute/unmute based on state
                    const audioTrack = stream.getAudioTracks()[0];
                    if (audioTrack) {
                        audioTrack.enabled = !isMicMuted;
                    }
                }
                setIsCamOn(true);
            } catch (err) {
                console.error('Failed to start video:', err);
                setError('Could not start webcam. Please ensure permissions are granted.');
            }
        }
    };
    
    const toggleMic = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        if(stream){
            const audioTrack = stream.getAudioTracks()[0];
            if(audioTrack){
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    }

    const handleCheck = async () => {
        if (!videoRef.current || !isCamOn) {
            setError('Please start your camera before checking.');
            return;
        }

        setIsChecking(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 500));

        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender();

        if (detections.length === 0) {
            setError('No face detected. Please position your face clearly in front of the camera.');
        } else if (detections.length > 1) {
            setError('Multiple faces detected. Please ensure only one person is in the frame.');
        } else {
            const gender = detections[0].gender;
            if (gender === 'female' || gender === 'male') {
                const user = session?.user;
                if (!user) {
                    setError('User session not found. Please log in again.');
                    setIsChecking(false);
                    return;
                }

                // Stop the webcam tracks before navigating
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());

                if (!user.is_anonymous) {
                    supabase
                        .from('users')
                        .update({ is_verified: true })
                        .eq('id', user.id)
                        .then(({ error: updateError }) => {
                            if (updateError) {
                                console.error('Failed to save verification status:', updateError.message);
                            }
                        });
                }
                
                sessionStorage.setItem('genderVerified', 'true');
                router.push('/dashboard');

            } else {
                setError('Could not determine gender. Please try again.');
            }
        }
        setIsChecking(false);
    };
  
    const getLoadingMessage = () => {
        switch(loadingStatus) {
            case 'Initializing': return 'Initializing...';
            case 'Loading Models': return 'Loading Verification Models...';
            case 'Models Loaded': return 'Ready to start camera...';
            case 'Error': return 'An error occurred.';
            default: return 'Loading...';
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12">
            <div className="w-full max-w-md space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    Gender Verification
                </h2>
                
                {error && <div className="rounded-md bg-red-100 p-4 text-sm text-red-700">{error}</div>}
                
                <div className="relative mx-auto h-80 w-80 overflow-hidden rounded-lg bg-black border-4 border-indigo-500 shadow-lg">
                    <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                    {loadingStatus !== 'Ready' && !isCamOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
                            {getLoadingMessage()}
                        </div>
                    )}
                </div>

                <div className="flex justify-center items-center gap-4 bg-white p-2 rounded-lg shadow-md">
                    <button onClick={startStopCamera} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                        {isCamOn ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <button onClick={toggleMic} disabled={!isCamOn} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50">
                        {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    {videoDevices.length > 1 && (
                         <select
                            value={selectedVideoDevice}
                            onChange={(e) => setSelectedVideoDevice(e.target.value)}
                            disabled={isCamOn}
                            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50"
                        >
                            {videoDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${videoDevices.indexOf(device) + 1}`}</option>
                            ))}
                        </select>
                    )}
                </div>
                
                <p className="text-sm text-gray-500">
                    {isCamOn ? 'Position your face in the frame.' : 'Please start your camera to begin verification.'}
                </p>

                <button
                    onClick={handleCheck}
                    disabled={isChecking || !isCamOn}
                    className="w-full rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-lg font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isChecking ? 'Checking...' : 'Check'}
                </button>
            </div>
        </div>
    );
} 