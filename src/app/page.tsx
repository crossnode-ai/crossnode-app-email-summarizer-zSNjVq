"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

// Define Zod schemas for runtime validation
const SummaryResponseSchema = z.object({
  summary: z.string(),
});

const ErrorResponseSchema = z.object({
  message: z.string(),
});

type SummaryResponse = z.infer<typeof SummaryResponseSchema>;
type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Custom hook for API calls
const useSummarize = () => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const summarizeEmail = async (emailContent: string): Promise<void> => {
    if (!emailContent.trim()) {
      setError("Please enter the email content to summarize.");
      return;
    }

    setIsLoading(true);
    setSummary(null);
    setError(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emailContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        const parsedError = ErrorResponseSchema.safeParse(data);
        if (parsedError.success) {
          throw new Error(parsedError.data.message || "Failed to summarize email.");
        } else {
          throw new Error("An unexpected error occurred while processing the response.");
        }
      }

      const parsedSummary = SummaryResponseSchema.safeParse(data);
      if (parsedSummary.success) {
        setSummary(parsedSummary.data.summary);
      } else {
        throw new Error("Received invalid summary data from the server.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { summary, isLoading, error, summarizeEmail, setSummary, setError };
};

export default function HomePage() {
  const [emailContent, setEmailContent] = useState<string>("");
  const { summary, isLoading, error, summarizeEmail, setSummary, setError } = useSummarize();

  const handleEmailChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEmailContent(event.target.value);
    // Clear only the error state when user starts typing again
    if (error) setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await summarizeEmail(emailContent);
  };

  const handleClear = () => {
    setEmailContent("");
    setSummary(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">
          Email Summarizer
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="emailContent" className="block text-lg font-medium mb-2">
              Enter Email Content:
            </label>
            <textarea
              id="emailContent"
              rows={10}
              className="w-full p-4 rounded-lg bg-gray-700 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none text-gray-200 placeholder-gray-400
              focus:outline-none"
              placeholder="Paste your email content here..."
              value={emailContent}
              onChange={handleEmailChange}
              aria-label="Email content input"
            />
          </div>

          <div className="flex justify-between items-center">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Summarizing..." : "Summarize"}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleClear}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition duration-300 ease-in-out"
            >
              Clear
            </motion.button>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 p-4 bg-red-500 bg-opacity-20 border border-red-400 text-red-300 rounded-lg"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 p-6 bg-green-500 bg-opacity-20 border border-green-400 text-green-300 rounded-lg"
            >
              <h2 className="text-2xl font-semibold mb-4 text-green-300">Summary:</h2>
              <p className="text-lg leading-relaxed">{summary}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}