import { useEffect, useRef, useState } from "react";

export function useCampaignInvite(campaignId: string) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const inviteRef = useRef<HTMLDivElement>(null);

  const inviteLink = campaignId
    ? `${window.location.origin}${window.location.pathname}?join=${campaignId}`
    : "";

  const handleCopyInvite = () => {
    void navigator.clipboard.writeText(inviteLink).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  };

  // Close popover when clicking outside
  useEffect(() => {
    if (!isInviteOpen) return;
    const handler = (e: MouseEvent) => {
      if (inviteRef.current && !inviteRef.current.contains(e.target as Node)) {
        setIsInviteOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isInviteOpen]);

  return {
    isInviteOpen,
    setIsInviteOpen,
    inviteCopied,
    inviteRef,
    inviteLink,
    handleCopyInvite,
  };
}
