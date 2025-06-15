'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as faceapi from 'face-api.js';
import { useSupabase } from '@/app/supabase-provider';

type LoadingStatus = 'Initializing' | 'Loading Models' | 'Models Loaded' | 'Starting Webcam' | 'Ready' | 'Error';

export default function GenderCheckPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('Initializing');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();
  const { supabase, session } = useSupabase();

  // Effect for loading models
  useEffect(() => {
    const loadModels = async () => {
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
    };
    loadModels();
  }, []); // Runs once on component mount

  // Effect for starting the webcam after models are loaded
  useEffect(() => {
    if (loadingStatus === 'Models Loaded') {
      const startVideo = async () => {
        setLoadingStatus('Starting Webcam');
        try {
          if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('getUserMedia is not supported by this browser.');
          }
          const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setLoadingStatus('Ready');
            }
          } else {
             throw new Error('Video reference not found.');
          }
        } catch (err) {
          console.error('Failed to start video:', err);
          let errorMessage = 'Could not access webcam. Please enable camera permissions in your browser and refresh the page.';
          if (err instanceof Error) {
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera access was denied. Please enable camera permissions in your browser settings and refresh the page.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera was found on this device. Please connect a camera and refresh the page.';
            }
          }
          setError(errorMessage);
          setLoadingStatus('Error');
        }
      };
      startVideo();
    }
  }, [loadingStatus]);

  const handleCheck = async () => {
    if (!videoRef.current || loadingStatus !== 'Ready') return;

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
      if (gender === 'female') {
        const user = session?.user;
        if (!user) {
          setError('User session not found. Please log in again.');
          setIsChecking(false);
          return;
        }

        // Stop the webcam tracks before navigating
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());

        // For regular users, we still update the database in the background
        if (!user.is_anonymous) {
          supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', user.id)
            .then(({ error: updateError }) => {
              if (updateError) {
                // If the background update fails, we can log it, but we don't need to block the user
                console.error('Failed to save verification status:', updateError.message);
              }
            });
        }
        
        // For ALL users, set the session storage flag and redirect immediately.
        // This is the key to breaking the redirect loop.
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
      case 'Initializing':
        return 'Initializing...';
      case 'Loading Models':
        return 'Loading Verification Models...';
      case 'Models Loaded':
        return 'Models Loaded, preparing camera...';
      case 'Starting Webcam':
        return 'Please allow camera permission...';
      case 'Error':
        return 'An error occurred.';
      default:
        return 'Loading...';
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Gender Verification
        </h2>
        
        {error && <div className="rounded-md bg-red-100 p-4 text-sm text-red-700">{error}</div>}
        
        <div className="relative mx-auto h-64 w-64 sm:h-80 sm:w-80 overflow-hidden rounded-lg shadow-lg border-2 border-black">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" />
          {loadingStatus !== 'Ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              {getLoadingMessage()}
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500">
          For security, we need to verify your gender. Please position your face in the frame.
        </p>

        <button
          onClick={handleCheck}
          disabled={isChecking || loadingStatus !== 'Ready'}
          className="w-full rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-lg font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check'}
        </button>
      </div>
    </div>
  );
} 