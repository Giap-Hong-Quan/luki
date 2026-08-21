"use client";

import React, { useSyncExternalStore } from "react";
import { PullCord } from "pullcord";
import "pullcord/pullcord.css";
import { useUIStore } from "@/stores/uiStore";

const emptySubscribe = () => () => {};

export default function ThemePullCord() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { theme, toggleTheme } = useUIStore();

  if (!isMounted) return null;

  return (
    <PullCord
      onPull={toggleTheme}
      pulled={theme === "dark"}
      ariaLabel="Kéo dây để đổi chế độ sáng / tối"
      className="[--pullcord-top:0px] [--pullcord-right:1.25rem] [--pullcord-z:999]"
    />
  );
}
