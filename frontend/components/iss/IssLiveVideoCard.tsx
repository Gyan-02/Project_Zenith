import React, { useState } from "react";
import "./iss-live-video.css";

interface IssLiveVideoCardProps {
  isDemo?: boolean;
}

export function IssLiveVideoCard({ isDemo = false }: IssLiveVideoCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Default to the active NASA ISS livestream video embed URL.
  // Note: Verify this video ID resolves to the active NASA ISS HD Earth Viewing stream before merging.
  const embedUrl = "https://www.youtube.com/embed/FuuC4dpSQ1M?autoplay=1&mute=1";
  const externalUrl = "https://www.youtube.com/@NASA/live";

  return (
    <div className="iss-video-card" data-testid="iss-live-video-card">
      <div className="iss-video-header">
        <span className="iss-video-title">Live from the ISS</span>
        {isDemo && (
          <span className="iss-video-badge" data-testid="iss-live-badge">
            External stream
          </span>
        )}
      </div>

      <div className="iss-video-viewport">
        {isLoading && (
          <div className="iss-video-skeleton" data-testid="iss-video-skeleton">
            <div className="iss-video-spinner" />
            <span>Connecting to live feed...</span>
          </div>
        )}
        <iframe
          width="100%"
          height="100%"
          className="iss-video-iframe"
          src={embedUrl}
          title="Live from the ISS – Official NASA Stream"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>

      <div className="iss-video-footer">
        <p className="iss-video-disclaimer">
          Live feed may be unavailable while the ISS is in orbital night (black screen) or during crew camera handovers.
        </p>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="iss-video-link-btn"
        >
          Open NASA stream ↗
        </a>
      </div>
    </div>
  );
}
