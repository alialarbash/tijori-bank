import { StyleSheet, View, ActivityIndicator, StatusBar } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setVideoShown } from "../../api/storage";

const VideoIntro = () => {
  const videoRef = useRef<Video>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Mark video as shown
    setVideoShown(true);

    // Set audio mode to allow sound
    const setupAudio = async () => {
      try {
        const { Audio } = await import("expo-av");
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };
    setupAudio();

    // Fallback: Navigate to home after 30 seconds if video doesn't finish
    const timeout = setTimeout(() => {
      router.replace("/(protected)/(tabs)");
    }, 30000);

    return () => clearTimeout(timeout);
  }, [router]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      // Handle error case - navigate to home if video fails to load
      if (status.error) {
        console.error("Video playback error:", status.error);
        router.replace("/(protected)/(tabs)");
      }
      return;
    }

    // Video is ready to play
    if (status.isLoaded && status.durationMillis && isLoading) {
      setIsLoading(false);
    }

    // Video finished playing
    if (status.didJustFinish) {
      // Navigate to home page (tabs)
      router.replace("/(protected)/(tabs)");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
      />
      {/* Status bar background cover */}
      <View
        style={[
          styles.statusBarCover,
          { height: insets.top, backgroundColor: "#000000" },
        ]}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D8A75F" />
        </View>
      )}
      <Video
        ref={videoRef}
        source={require("../../assets/vaultIntro.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        isLooping={false}
        isMuted={false}
        volume={1.0}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => {
          setIsLoading(false);
          // Ensure video plays
          videoRef.current?.playAsync();
        }}
        onError={(error) => {
          console.error("Video error:", error);
          router.replace("/(protected)/(tabs)");
        }}
      />
    </View>
  );
};

export default VideoIntro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBarCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
