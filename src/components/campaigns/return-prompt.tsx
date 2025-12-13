"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReturnPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sent: boolean) => void;
  recipientName?: string;
}

/**
 * Return Prompt Component
 * Shows when user returns from SMS app to confirm if message was sent
 */
export function ReturnPrompt({
  isOpen,
  onClose,
  onConfirm,
  recipientName,
}: ReturnPromptProps) {
  const handleYes = () => {
    onConfirm(true);
    onClose();
  };

  const handleNo = () => {
    onConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Did you send the message?</DialogTitle>
          <DialogDescription>
            {recipientName
              ? `Did you successfully send the message to ${recipientName}?`
              : "Did you successfully send the message?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleNo}>
            No, skip
          </Button>
          <Button onClick={handleYes}>
            Yes, sent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for return detection
 * Uses refs to avoid stale closures
 */
export function useReturnDetection(
  onReturn: (lastOpenedRecipientId: string | undefined) => void
) {
  const awaitingReturnRef = useRef(false);
  const lastOpenedRecipientIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && awaitingReturnRef.current) {
        // Prevent double prompt by immediately setting to false
        awaitingReturnRef.current = false;
        
        // Only show prompt if we have a lastOpenedRecipientId
        if (lastOpenedRecipientIdRef.current) {
          onReturn(lastOpenedRecipientIdRef.current);
        }
      }
    };

    const handleFocus = () => {
      if (awaitingReturnRef.current) {
        // Prevent double prompt by immediately setting to false
        awaitingReturnRef.current = false;
        
        // Only show prompt if we have a lastOpenedRecipientId
        if (lastOpenedRecipientIdRef.current) {
          onReturn(lastOpenedRecipientIdRef.current);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [onReturn]);

  return {
    setAwaitingReturn: (value: boolean) => {
      awaitingReturnRef.current = value;
    },
    setLastOpenedRecipientId: (id: string | undefined) => {
      lastOpenedRecipientIdRef.current = id;
    },
    getLastOpenedRecipientId: () => lastOpenedRecipientIdRef.current,
  };
}
