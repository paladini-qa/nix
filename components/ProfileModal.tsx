import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  KeyRound,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  userEmail: string;
  onUpdateDisplayName: (name: string) => void;
  onChangeEmail: (newEmail: string) => Promise<void>;
  onResetPassword: () => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  displayName,
  userEmail,
  onUpdateDisplayName,
  onChangeEmail,
  onResetPassword,
}) => {
  const [localDisplayName, setLocalDisplayName] = useState(displayName);
  const [newEmail, setNewEmail] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "saving" | "sent" | "error"
  >("idle");
  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (localDisplayName.trim() && localDisplayName !== displayName) {
      setNameStatus("saving");
      onUpdateDisplayName(localDisplayName.trim());
      setNameStatus("saved");
      setTimeout(() => setNameStatus("idle"), 2000);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setEmailStatus("error");
      return;
    }

    setEmailStatus("saving");
    setErrorMessage("");

    try {
      await onChangeEmail(newEmail.trim());
      setEmailStatus("sent");
      setNewEmail("");
    } catch (err: any) {
      setErrorMessage(err.message || "Error updating email.");
      setEmailStatus("error");
    }
  };

  const handleResetPassword = async () => {
    setPasswordStatus("sending");
    setErrorMessage("");

    try {
      await onResetPassword();
      setPasswordStatus("sent");
    } catch (err: any) {
      setErrorMessage(err.message || "Error sending reset email.");
      setPasswordStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <User
                size={20}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Profile
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Display Name Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
              <User size={18} />
              <span className="font-medium">Display Name</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={localDisplayName}
                onChange={(e) => setLocalDisplayName(e.target.value)}
                placeholder="Enter your name..."
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                disabled={
                  localDisplayName === displayName || nameStatus === "saving"
                }
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 min-w-[80px] justify-center ${
                  nameStatus === "saved"
                    ? "bg-emerald-600 text-white"
                    : localDisplayName !== displayName
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {nameStatus === "saving" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : nameStatus === "saved" ? (
                  <>
                    <Check size={16} />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-white/10" />

          {/* Change Email Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
              <Mail size={18} />
              <span className="font-medium">Change Email</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              A confirmation will be sent to both your current and new email.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email..."
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
              />
              <button
                onClick={handleChangeEmail}
                disabled={!newEmail.trim() || emailStatus === "saving"}
                className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 min-w-[100px] justify-center ${
                  emailStatus === "sent"
                    ? "bg-emerald-600 text-white"
                    : newEmail.trim()
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {emailStatus === "saving" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : emailStatus === "sent" ? (
                  <>
                    <Check size={16} />
                    <span>Sent!</span>
                  </>
                ) : (
                  <span>Change</span>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-white/10" />

          {/* Reset Password Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
              <KeyRound size={18} />
              <span className="font-medium">Reset Password</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              A password reset link will be sent to {userEmail}
            </p>
            <button
              onClick={handleResetPassword}
              disabled={passwordStatus === "sending"}
              className={`w-full px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                passwordStatus === "sent"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              }`}
            >
              {passwordStatus === "sending" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : passwordStatus === "sent" ? (
                <>
                  <Check size={16} />
                  <span>Email Sent!</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Send Reset Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
