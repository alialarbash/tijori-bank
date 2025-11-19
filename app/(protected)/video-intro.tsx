import { StyleSheet, View, ActivityIndicator, StatusBar } from "react-native";
import React, { useEffect, useState } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setVideoShown } from "../../api/storage";

const VideoIntro = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Create video player
  const player = useVideoPlayer(
    require("../../assets/vaultIntro.mp4"),
    (player) => {
      // Video is ready
      setIsLoading(false);
      player.play();
    }
  );

  useEffect(() => {
    // Mark video as shown
    setVideoShown(true);

    // Listen for playback end
    const subscription = player.addListener("playToEnd", () => {
      router.replace("/(protected)/(tabs)");
    });

    // Fallback: Navigate to home after 30 seconds
    const timeout = setTimeout(() => {
      router.replace("/(protected)/(tabs)");
    }, 30000);

    return () => {
      subscription.remove();
      clearTimeout(timeout);
    };
  }, [router, player]);

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
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
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
    color: "#fff",
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
