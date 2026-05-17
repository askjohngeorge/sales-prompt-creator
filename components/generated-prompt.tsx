"use client"

import { CopyButton, DeleteButton, CallButton } from "./prompt-actions"
import { CallErrorToast } from "./call-error-toast"
import ReactMarkdown from "react-markdown"
import { useEffect, useState, useCallback, useRef } from "react"
import { PromptHistory } from "./prompt-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormValues, ApiKeyValues } from "./prompt-form"

interface PromptHistoryItem {
  id: string
  content: string
  timestamp: number
  formData: Omit<FormValues, keyof ApiKeyValues>
}

interface GeneratedPromptProps {
  prompt: string | null
  isLoading: boolean
  currentFormData: (FormValues & ApiKeyValues) | null
  onRestoreFormData: (formData: FormValues & ApiKeyValues) => void
  onRestorePrompt: (prompt: string) => void
  onClearPrompt: () => void
  containerHeight: number
}

const HISTORY_STORAGE_KEY = "prompt-history"
const CURRENT_PROMPT_KEY = "current-prompt"

export function GeneratedPrompt({ 
  prompt, 
  isLoading, 
  currentFormData,
  onRestoreFormData,
  onRestorePrompt,
  onClearPrompt,
  containerHeight
}: GeneratedPromptProps) {
  const [history, setHistory] = useState<PromptHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState("current")
  const [mounted, setMounted] = useState(false)
  const initialPromptRef = useRef(prompt)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load history and current prompt from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }

    const savedPrompt = localStorage.getItem(CURRENT_PROMPT_KEY)
    if (savedPrompt && !initialPromptRef.current) {
      onRestorePrompt(savedPrompt)
    }
  }, [onRestorePrompt])

  // Add new prompt to history
  useEffect(() => {
    if (prompt && !isLoading) {
      const newItem: PromptHistoryItem = {
        id: Math.random().toString(36).substring(7),
        content: prompt,
        timestamp: Date.now(),
        formData: currentFormData ? {
          model: currentFormData.model,
          aiName: currentFormData.aiName,
          companyName: currentFormData.companyName,
          industry: currentFormData.industry,
          targetAudience: currentFormData.targetAudience,
          challenges: currentFormData.challenges,
          product: currentFormData.product,
          objective: currentFormData.objective,
          objections: currentFormData.objections,
          additionalInfo: currentFormData.additionalInfo,
        } : {
          model: "gpt-4o-mini",
          aiName: "",
          companyName: "",
          industry: "",
          targetAudience: "",
          challenges: "",
          product: "",
          objective: "",
          objections: "",
          additionalInfo: "",
        }
      }

      // Only add to history if not already present
      const existingItemIndex = history.findIndex(item => item.content === prompt);
      if (existingItemIndex === -1) {
        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      }
    }
  }, [prompt, isLoading, currentFormData, history])

  // Handle tab switching only when new prompt is generated
  useEffect(() => {
    if (prompt && !isLoading) {
      setActiveTab("current")
    }
  }, [prompt, isLoading])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (mounted && history.length > 0) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
    }
  }, [history, mounted])

  // Save current prompt to localStorage
  useEffect(() => {
    if (!isLoading) {
      if (prompt) {
        localStorage.setItem(CURRENT_PROMPT_KEY, prompt)
      } else {
        localStorage.removeItem(CURRENT_PROMPT_KEY)
      }
    }
  }, [prompt, isLoading])

  const handleRestoreItem = useCallback((item: PromptHistoryItem) => {
    // Preserve current API keys when restoring
    const restoredFormData = {
      ...item.formData,
      apiKey: currentFormData?.apiKey || "",
      vapiKey: currentFormData?.vapiKey || "",
    };
    onRestoreFormData(restoredFormData)
    onRestorePrompt(item.content)
  }, [onRestoreFormData, onRestorePrompt, currentFormData])

  const handleDeleteItem = (id: string) => {
    // Update history
    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))

    // If the deleted item matches the current prompt, clear it
    const itemToDelete = history.find(item => item.id === id);
    if (itemToDelete && itemToDelete.content === prompt) {
      onClearPrompt();
      localStorage.removeItem(CURRENT_PROMPT_KEY);
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between mb-1 flex-none">
          <TabsList>
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="history" className="relative">
              History
              {history.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {history.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 relative">
          <TabsContent value="current" className="absolute inset-0">
            <div className="relative max-h-full">
              {isLoading ? (
                <div className="prose prose-sm max-w-none rounded-md border bg-white/50 p-4 dark:prose-invert">
                  <div className="flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
                  </div>
                </div>
              ) : prompt ? (
                <div className="prose prose-sm max-w-none rounded-md border bg-white/50 p-4 dark:prose-invert">
                  <div className="overflow-auto" style={{ maxHeight: containerHeight ? `${containerHeight - 84}px` : 'auto' }}>
                    <ReactMarkdown>{prompt}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-white p-6 text-sm text-center text-muted-foreground">
                  Your generated prompt will appear here.
                </div>
              )}
              {prompt && !isLoading && (
                <div className="absolute right-2 -top-4 flex gap-1">
                  <CallButton 
                    buttonId="generated-prompt-call"
                    onCall={async () => {
                      if (!prompt) {
                        throw new Error('No prompt available');
                      }
                      
                      if (!currentFormData) {
                        throw new Error('Please fill out the form first');
                      }
                      
                      if (!currentFormData.vapiKey) {
                        throw new Error('VAPI API key is required. Please enter it in the API Configuration section.');
                      }

                      return {
                        apiKey: currentFormData.vapiKey,
                        systemPrompt: prompt,
                        context: {
                          assistantName: currentFormData.aiName || 'AI Assistant',
                          companyName: currentFormData.companyName || 'Company'
                        }
                      };
                    }}
                  />
                  <CopyButton text={prompt} />
                  <DeleteButton 
                    onDelete={() => {
                      // Only clear the current prompt, don't affect history
                      localStorage.removeItem(CURRENT_PROMPT_KEY);
                      onClearPrompt();
                    }}
                    deleteMessage="Clear current prompt"
                    confirmationMessage="Click to confirm clearing"
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="absolute inset-0">
            <div className="h-full overflow-auto" style={{ maxHeight: containerHeight ? `${containerHeight - 48}px` : 'auto' }}>
              <PromptHistory 
                history={history} 
                onDelete={handleDeleteItem} 
                onRestore={handleRestoreItem}
                currentFormData={currentFormData}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
      <CallErrorToast />
    </>
  )
}
