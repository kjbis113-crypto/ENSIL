"use client";

import { useEffect, useRef } from "react";
import { useEcosystem } from "../store/ecosystem";

type AudioGraph = {
  context: AudioContext;
  master: GainNode;
  nodes: AudioNode[];
  oscillators: OscillatorNode[];
  timer: number;
};

export function useAudioEngine() {
  const sound = useEcosystem((state) => state.sound);
  const graph = useRef<AudioGraph | null>(null);

  useEffect(() => {
    if (!sound) {
      if (graph.current) {
        window.clearInterval(graph.current.timer);
        graph.current.master.gain.setTargetAtTime(0, graph.current.context.currentTime, 0.08);
        const current = graph.current;
        window.setTimeout(() => void current.context.close(), 260);
        graph.current = null;
      }
      return;
    }

    const AudioContextClass = window.AudioContext;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 1.5);
    master.connect(context.destination);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.8;
    filter.connect(master);

    const hum = context.createOscillator();
    const humGain = context.createGain();
    hum.type = "sine";
    hum.frequency.value = 54;
    humGain.gain.value = 0.25;
    hum.connect(humGain).connect(filter);
    hum.start();

    const breath = context.createOscillator();
    const breathGain = context.createGain();
    breath.type = "triangle";
    breath.frequency.value = 81;
    breathGain.gain.value = 0.045;
    breath.connect(breathGain).connect(filter);
    breath.start();

    const timer = window.setInterval(() => {
      if (context.state !== "running") return;
      const now = context.currentTime;
      const click = context.createOscillator();
      const clickGain = context.createGain();
      click.type = "square";
      click.frequency.setValueAtTime(620 + Math.sin(now * 2.3) * 180, now);
      clickGain.gain.setValueAtTime(0.0001, now);
      clickGain.gain.exponentialRampToValueAtTime(0.025, now + 0.004);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      click.connect(clickGain).connect(master);
      click.start(now);
      click.stop(now + 0.08);
    }, 2600);

    graph.current = { context, master, nodes: [filter, humGain, breathGain], oscillators: [hum, breath], timer };
    return () => {
      window.clearInterval(timer);
      void context.close();
      graph.current = null;
    };
  }, [sound]);
}

export function useMicrophoneMode() {
  const microphone = useEcosystem((state) => state.microphone);
  const setMicrophone = useEcosystem((state) => state.setMicrophone);
  const setMicIntensity = useEcosystem((state) => state.setMicIntensity);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!microphone) {
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      void contextRef.current?.close();
      contextRef.current = null;
      setMicIntensity(0.22);
      return;
    }

    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const context = new AudioContext();
        contextRef.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const sample = () => {
          analyser.getByteFrequencyData(data);
          const average = data.reduce((sum, value) => sum + value, 0) / (data.length * 255);
          setMicIntensity(Math.min(1, average * 2.8));
          frameRef.current = requestAnimationFrame(sample);
        };
        sample();
      })
      .catch(() => setMicrophone(false));

    return () => {
      active = false;
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close();
    };
  }, [microphone, setMicIntensity, setMicrophone]);
}
