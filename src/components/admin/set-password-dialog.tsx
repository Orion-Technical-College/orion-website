"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check, Eye, EyeOff, RefreshCw } from "lucide-react";

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
  userName: string;
  isLoading?: boolean;
}

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const special = "!@#$%";
  let password = "";
  
  // Generate 12 random chars
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add a special character
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

export function SetPasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isLoading = false,
}: SetPasswordDialogProps) {
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resultPassword, setResultPassword] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setUseCustomPassword(false);
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setGeneratedPassword(generatePassword());
      setCopied(false);
      setError(null);
      setSuccess(false);
      setResultPassword(null);
    }
  }, [open]);

  const handleGenerateNew = () => {
    setGeneratedPassword(generatePassword());
    setCopied(false);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalPassword = useCustomPassword ? password : generatedPassword;

    // Validate password
    const validationError = validatePassword(finalPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check confirmation if custom password
    if (useCustomPassword && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await onConfirm(finalPassword);
      setResultPassword(finalPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to set password");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Set Password</DialogTitle>
          <DialogDescription>
            Set a password for <strong>{userName}</strong>. The user will be required to change it on first login.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4">
              <p className="text-sm text-green-400 font-medium mb-2">Password set successfully!</p>
              <p className="text-xs text-foreground-muted mb-3">
                Share this password with the user. They will be required to change it on first login.
              </p>
              <div className="flex items-center gap-2 bg-background-secondary rounded p-2">
                <code className="flex-1 font-mono text-sm select-all">{resultPassword}</code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleCopy(resultPassword!)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Toggle between generated and custom password */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCustomPassword"
                  checked={useCustomPassword}
                  onCheckedChange={(checked) => setUseCustomPassword(checked === true)}
                />
                <label htmlFor="useCustomPassword" className="text-sm font-medium cursor-pointer">
                  Enter custom password
                </label>
              </div>

              {useCustomPassword ? (
                <>
                  {/* Custom password input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2.5 text-foreground-muted hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                    />
                  </div>

                  <p className="text-xs text-foreground-muted">
                    Password must be at least 8 characters with uppercase, lowercase, and numbers.
                  </p>
                </>
              ) : (
                <>
                  {/* Generated password display */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Generated Password</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-background-secondary rounded p-2 border border-border">
                        <code className="flex-1 font-mono text-sm select-all">
                          {showPassword ? generatedPassword : "•".repeat(generatedPassword.length)}
                        </code>
                        <button
                          type="button"
                          className="text-foreground-muted hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGenerateNew}
                        title="Generate new password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(generatedPassword)}
                        title="Copy password"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      A secure random password has been generated. You can regenerate or copy it.
                    </p>
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Setting..." : "Set Password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
