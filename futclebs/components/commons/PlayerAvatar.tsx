import React, { useMemo } from "react";

interface Props {
  name?: string | null;
  avatar?: string | null;
  size?: number;
  onClick?: () => void;
  className?: string;
}

const generateColorFromName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

export const PlayerAvatar: React.FC<Props> = ({
  name,
  avatar,
  size = 44,
  onClick,
  className = "",
}) => {
  const fallbackColor = useMemo(() => {
    if (!name) return "hsl(160, 70%, 45%)";
    return generateColorFromName(name);
  }, [name]);

  const firstLetter = name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`rounded-2xl overflow-hidden flex items-center justify-center font-black uppercase select-none transition-all ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } ${className}`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          style={{
            background: fallbackColor,
            fontSize: size / 2.5,
          }}
          className="w-full h-full flex items-center justify-center text-white"
        >
          {firstLetter}
        </div>
      )}
    </div>
  );
};
