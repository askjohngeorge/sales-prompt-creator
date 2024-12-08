"use client"

import { useEffect, useState, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  apiKey: z.string().min(1, "OpenAI API key is required"),
  model: z.string().min(1, "Model selection is required"),
  aiName: z.string().min(1, "AI name is required"),
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  challenges: z.string().min(1, "Challenges are required"),
  product: z.string().min(1, "Product/service is required"),
  objective: z.string().min(1, "Call objective is required"),
  objections: z.string().min(1, "Common objections are required"),
  additionalInfo: z.string().optional(),
})

export type FormValues = z.infer<typeof formSchema>

interface PromptFormProps {
  onSubmit: (values: FormValues) => void
  isLoading?: boolean
}

const STORAGE_KEY = "sales-prompt-form"

export function PromptForm({ onSubmit, isLoading = false }: PromptFormProps) {
  const [mounted, setMounted] = useState(false)
  const [models, setModels] = useState<Array<{ id: string }>>([
    { id: "gpt-4o-mini" },
    { id: "gpt-4o" }
  ])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: "gpt-4o-mini",
      apiKey: "",
      aiName: "",
      companyName: "",
      industry: "",
      targetAudience: "",
      challenges: "",
      product: "",
      objective: "",
      objections: "",
      additionalInfo: "",
    },
  })

  // Load saved form data from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai-api-key")
    const savedFormData = localStorage.getItem(STORAGE_KEY)
    
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData)
      Object.entries(parsedData).forEach(([key, value]) => {
        if (key !== "apiKey") {
          form.setValue(key as keyof FormValues, value as string)
        }
      })
    }
    
    if (savedApiKey) {
      form.setValue("apiKey", savedApiKey)
    }
    
    setMounted(true)
  }, [form])

  // Fetch available models only when API key is valid
  const fetchModels = useCallback(async (apiKey: string) => {
    if (!apiKey || !mounted || typeof window === 'undefined') return

    setIsLoadingModels(true)
    try {
      const { OpenAI } = await import('openai')
      const openai = new OpenAI({ 
        apiKey,
        dangerouslyAllowBrowser: true // Required for client-side only architecture
      })
      const modelList = await openai.models.list()
      // Ensure our default models are always included
      const defaultModels = ["gpt-4o-mini", "gpt-4o"]
      const allModels = Array.from(modelList.data)
      const filteredModels = allModels.filter(model => !defaultModels.includes(model.id))
      setModels([
        { id: "gpt-4o-mini" },
        { id: "gpt-4o" },
        ...filteredModels
      ])
    } catch (error) {
      console.error("Failed to fetch models:", error)
      toast({
        title: "Failed to load models",
        description: "Using default models only. Please check your API key.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingModels(false)
    }
  }, [mounted, toast])

  // Watch for API key changes
  const apiKey = form.watch("apiKey")
  useEffect(() => {
    if (mounted && apiKey?.length >= 30) {
      const timer = setTimeout(() => {
        fetchModels(apiKey)
      }, 500) // Debounce API key changes
      return () => clearTimeout(timer)
    }
  }, [apiKey, mounted, fetchModels])

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      return (formData: FormValues) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          const dataToSave = {
            model: formData.model,
            aiName: formData.aiName,
            companyName: formData.companyName,
            industry: formData.industry,
            targetAudience: formData.targetAudience,
            challenges: formData.challenges,
            product: formData.product,
            objective: formData.objective,
            objections: formData.objections,
            additionalInfo: formData.additionalInfo,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
          // Also save API key with the same debounce timing
          if (formData.apiKey) {
            localStorage.setItem("openai-api-key", formData.apiKey)
          }
          timeoutId = null;
        }, 300);
      };
    })(),
    []
  );

  // Save form data to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      const formData = form.getValues()
      debouncedSave(formData)
    }
  }, [form.watch(), mounted, debouncedSave])

  const handleSubmit = (values: FormValues) => {
    onSubmit(values)
  }

  const resetForm = () => {
    const apiKey = form.getValues("apiKey")
    form.reset({
      model: "gpt-4o-mini",
      apiKey,
      aiName: "",
      companyName: "",
      industry: "",
      targetAudience: "",
      challenges: "",
      product: "",
      objective: "",
      objections: "",
      additionalInfo: "",
    })
    localStorage.removeItem(STORAGE_KEY)
    toast({
      title: "Form Reset",
      description: "All fields have been cleared except the API key",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 bg-white rounded-lg border p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium">OpenAI Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Your API key will be saved locally
                </p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="sk-..." className="bg-muted/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end gap-2 mt-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingModels ? (
                          <SelectItem value="loading" disabled>
                            Loading models...
                          </SelectItem>
                        ) : (
                          models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.id}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="whitespace-nowrap mb-[2px]"
                size="sm"
              >
                Reset Form
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="aiName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Representative Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sarah" className="bg-muted/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. TechCorp Solutions" className="bg-muted/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. SaaS, Healthcare" className="bg-muted/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Small business owners"
                      className="bg-muted/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-4" />

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product/Service Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product or service and its key features..."
                      className="h-20 bg-muted/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenges Solved</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What specific problems does your product solve?"
                      className="h-20 bg-muted/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Call Objective</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Schedule a demo, Book a consultation"
                      className="bg-muted/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Objections</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the most common objections and how to handle them..."
                      className="h-20 bg-muted/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="additionalInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Context (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any other details that might be helpful..."
                    className="h-20 bg-muted/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? "Generating..." : "Generate Prompt"}
        </Button>
      </form>
    </Form>
  )
}
