"use client"

import { useState, useEffect, useRef } from "react"
import { PromptForm } from "@/components/prompt-form"
import { type FormValues, type ApiKeyValues } from "@/components/prompt-form"
import { generateSalesPrompt } from "@/lib/openai"
import { GeneratedPrompt } from "@/components/generated-prompt"

const STORAGE_KEY = "sales-prompt-result"

export function PromptContainer() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [currentFormData, setCurrentFormData] = useState<(FormValues & ApiKeyValues) | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const [formHeight, setFormHeight] = useState<number>(0)

  // Load saved result from localStorage
  useEffect(() => {
    // Only clear prompt-related data
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("sales-prompt-form-deleted");
    localStorage.removeItem("sales-prompt-form-can-undo");
    
    // Then load fresh result if exists
    const savedResult = localStorage.getItem(STORAGE_KEY)
    if (savedResult) {
      setResult(savedResult)
    }
  }, [])

  useEffect(() => {
    const updateHeight = () => {
      if (formRef.current) {
        setFormHeight(formRef.current.offsetHeight)
      }
    }
    
    // Initial update
    updateHeight()
    
    // Update after a short delay to ensure form is fully rendered
    const initialTimer = setTimeout(updateHeight, 100)
    
    // Update on window resize
    window.addEventListener('resize', updateHeight)
    
    // Create a mutation observer to watch for DOM changes
    const observer = new MutationObserver(updateHeight)
    if (formRef.current) {
      observer.observe(formRef.current, { 
        subtree: true, 
        childList: true,
        attributes: true 
      })
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight)
      observer.disconnect()
      clearTimeout(initialTimer)
    }
  }, [])

  useEffect(() => {
    if (result) {
      localStorage.setItem(STORAGE_KEY, result)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [result])

  const handleSubmit = async (values: FormValues & ApiKeyValues) => {
    if (!values.apiKey) {
      return false
    }
    setIsLoading(true)
    setCurrentFormData(values)
    try {
      const prompt = await generateSalesPrompt(values)
      setResult(prompt)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreFormData = (formData: FormValues & ApiKeyValues | null) => {
    if (formData) {
      setCurrentFormData(formData)
    }
  }

  const handleRestorePrompt = (prompt: string) => {
    setResult(prompt)
  }

  const handleClearPrompt = () => {
    setResult(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div ref={formRef}>
        <PromptForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          restoredFormData={currentFormData}
          onFormDataLoad={setCurrentFormData}
        />
      </div>
      <div className="mt-0 lg:mt-0 lg:pl-0 flex flex-col" style={{ height: formHeight ? `${formHeight}px` : 'auto' }}>
        <GeneratedPrompt 
          prompt={result} 
          isLoading={isLoading}
          currentFormData={currentFormData}
          onRestoreFormData={handleRestoreFormData}
          onRestorePrompt={handleRestorePrompt}
          onClearPrompt={handleClearPrompt}
          containerHeight={formHeight}
        />
      </div>
    </div>
  )
}
