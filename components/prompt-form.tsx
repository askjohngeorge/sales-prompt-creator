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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const formSchema = z.object({
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

const apiKeySchema = z.object({
  apiKey: z.string().min(1, "OpenAI API key is required"),
  vapiKey: z.string().optional(),
})

export type FormValues = z.infer<typeof formSchema>;
export type ApiKeyValues = z.infer<typeof apiKeySchema>;

interface PromptFormProps {
  onSubmit: (values: FormValues & ApiKeyValues) => void
  isLoading?: boolean
  restoredFormData: FormValues & ApiKeyValues | null
  onFormDataLoad?: (values: FormValues & ApiKeyValues) => void
}

const STORAGE_KEY = "sales-prompt-form"
const DELETED_DATA_KEY = "sales-prompt-form-deleted"
const UNDO_STATE_KEY = "sales-prompt-form-can-undo"
const API_SECTION_STATE_KEY = "sales-prompt-form-api-section"

export function PromptForm({ onSubmit, isLoading = false, restoredFormData, onFormDataLoad }: PromptFormProps) {
  const [mounted, setMounted] = useState(false)
  const [models] = useState([
    { id: "gpt-4o-mini" },
    { id: "gpt-4o" }
  ])
  const [canUndo, setCanUndo] = useState(false)
  const [isApiOpen, setIsApiOpen] = useState(true)
  const { toast } = useToast()

  // Load API section state from localStorage
  useEffect(() => {
    const savedApiSectionState = localStorage.getItem(API_SECTION_STATE_KEY)
    // Only close the section if explicitly set to false in localStorage
    if (savedApiSectionState === "false") {
      setIsApiOpen(false)
    }
  }, [])

  // Save API section state to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(API_SECTION_STATE_KEY, isApiOpen.toString())
    }
  }, [isApiOpen, mounted])

  const form = useForm<FormValues & ApiKeyValues>({
    resolver: zodResolver(z.intersection(formSchema, apiKeySchema)),
    defaultValues: {
      model: "gpt-4o-mini",
      apiKey: "",
      vapiKey: "",
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
    const savedVapiKey = localStorage.getItem("vapi-api-key")
    const savedFormData = localStorage.getItem(STORAGE_KEY)
    const canUndoState = localStorage.getItem(UNDO_STATE_KEY) === "true"
    
    setCanUndo(canUndoState)
    
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData)
      Object.entries(parsedData).forEach(([key, value]) => {
        if (key !== "apiKey" && key !== "vapiKey") {
          form.setValue(key as keyof (FormValues & ApiKeyValues), value as string)
        }
      })
    }
    
    if (savedApiKey) {
      form.setValue("apiKey", savedApiKey)
    }
    
    if (savedVapiKey) {
      form.setValue("vapiKey", savedVapiKey)
    }
    
    setMounted(true)
    
    // Notify parent of loaded form data without triggering submission
    if (onFormDataLoad) {
      onFormDataLoad(form.getValues())
    }
  }, [form, onFormDataLoad])

  // Watch for API keys changes and notify parent
  useEffect(() => {
    if (mounted) {
      const formData = form.getValues()
      onFormDataLoad?.(formData)
    }
  }, [mounted, form.watch("vapiKey"), form.watch("apiKey"), onFormDataLoad])

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;
      return (formData: FormValues & ApiKeyValues) => {
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
            apiKey: formData.apiKey,
            vapiKey: formData.vapiKey
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
          
          // Handle OpenAI API key
          if (formData.apiKey) {
            localStorage.setItem("openai-api-key", formData.apiKey)
          } else {
            localStorage.removeItem("openai-api-key")
          }
          
          // Handle VAPI API key
          if (formData.vapiKey) {
            localStorage.setItem("vapi-api-key", formData.vapiKey)
          } else {
            localStorage.removeItem("vapi-api-key")
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
      const formDataToSave = {
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
        apiKey: formData.apiKey,
        vapiKey: formData.vapiKey
      }
      debouncedSave(formDataToSave)
      
      // Only disable undo if the form has been modified
      if (form.formState.isDirty && canUndo) {
        setCanUndo(false)
        localStorage.setItem(UNDO_STATE_KEY, "false")
        localStorage.removeItem(DELETED_DATA_KEY)
      }
    }
  }, [form.formState.isDirty, mounted, debouncedSave, canUndo])

  // Handle restored form data
  useEffect(() => {
    if (restoredFormData && mounted) {
      // Get current API keys before reset
      const currentApiKeys = {
        apiKey: form.getValues("apiKey"),
        vapiKey: form.getValues("vapiKey")
      };

      // Merge restored data with current API keys
      const mergedData = {
        ...restoredFormData,
        apiKey: currentApiKeys.apiKey,
        vapiKey: currentApiKeys.vapiKey
      };

      // Reset form and save to localStorage
      form.reset(mergedData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
      
      // Clear undo state when restoring from history
      setCanUndo(false);
      localStorage.setItem(UNDO_STATE_KEY, "false");
      localStorage.removeItem(DELETED_DATA_KEY);
    }
  }, [restoredFormData, form, mounted]);

  const handleSubmit = (values: FormValues & ApiKeyValues) => {
    onSubmit(values)
  }

  const resetForm = () => {
    if (canUndo) {
      // Restore the deleted data
      const deletedData = localStorage.getItem(DELETED_DATA_KEY)
      if (deletedData) {
        const parsedData = JSON.parse(deletedData)
        
        // Ensure we have all the required fields
        const restoredData = {
          model: parsedData.model || "gpt-4o-mini",
          apiKey: form.getValues("apiKey"), // Keep current API key
          vapiKey: form.getValues("vapiKey"), // Keep current VAPI key
          aiName: parsedData.aiName || "",
          companyName: parsedData.companyName || "",
          industry: parsedData.industry || "",
          targetAudience: parsedData.targetAudience || "",
          challenges: parsedData.challenges || "",
          product: parsedData.product || "",
          objective: parsedData.objective || "",
          objections: parsedData.objections || "",
          additionalInfo: parsedData.additionalInfo || ""
        }
        
        // Reset form with complete data
        form.reset(restoredData)
        
        // Update localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredData))
        localStorage.removeItem(DELETED_DATA_KEY)
        setCanUndo(false)
        localStorage.setItem(UNDO_STATE_KEY, "false")
        
        toast({
          title: "Form Restored",
          description: "Previous form data has been restored",
        })
      }
    } else {
      // Store the current data before clearing
      const currentFormData = form.getValues()
      const dataToStore = {
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
        apiKey: "",
        vapiKey: ""
      }
      localStorage.setItem(DELETED_DATA_KEY, JSON.stringify(dataToStore))
      
      const apiKey = form.getValues("apiKey")
      const vapiKey = form.getValues("vapiKey")
      form.reset({
        model: "gpt-4o-mini",
        apiKey,
        vapiKey,
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
      setCanUndo(true)
      localStorage.setItem(UNDO_STATE_KEY, "true")
      toast({
        title: "Form Reset",
        description: "All fields have been cleared except the API keys",
      })
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8 bg-white rounded-lg border p-6">
        <div className="space-y-4">
          <Collapsible
            open={isApiOpen}
            onOpenChange={setIsApiOpen}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      !isApiOpen ? "" : "rotate-180"
                    }`} />
                    <span className="sr-only">Toggle API configuration</span>
                  </Button>
                </CollapsibleTrigger>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">API Keys</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertCircle className="h-6 w-6 text-destructive hover:text-destructive/70" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[350px] bg-destructive text-destructive-foreground p-4 space-y-3 font-medium">
                          <p className="font-semibold text-lg">Security Notice:</p>
                          <div className="space-y-2 text-sm font-medium">
                            <p>Your API key will be stored in your browser&apos;s localStorage. Please note:</p>
                            <ul className="list-disc pl-6 space-y-1.5 font-medium">
                              <li>Browser extensions can access these keys, so ensure you trust the authors of yours.</li>
                              <li>Keys are visible in browser dev tools, so ensure you trust anyone you let access them.</li>
                            </ul>
                          </div>
                          <p className="text-sm font-medium">These risks exist whenever you enter API keys in a browser, whether stored or not. Consider entering your key each session if you prefer not to store it.</p>
                          <p className="text-sm font-medium">I also recommend you create special API keys for use with this tool, and be sure to delete them when you no longer intend to use the app for some time.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
            <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
              <div className="flex gap-4 bg-background p-0.5">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>OpenAI API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="sk-..." className="bg-muted/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vapiKey"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>VAPI API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="vapi-..." className="bg-muted/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          <div className="flex items-end gap-2">
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
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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

        <div className="flex gap-2">
          <Button 
            type="button" 
            className="flex-1"
            disabled={isLoading}
            size="lg"
            onClick={() => {
              const apiKey = form.getValues("apiKey")
              if (!apiKey) {
                toast({
                  title: "OpenAI API Key Required",
                  description: "Please check your OpenAI API key in the API Configuration section",
                  variant: "destructive",
                })
                setIsApiOpen(true)
                return
              }
              form.handleSubmit(handleSubmit)()
            }}
          >
            {isLoading ? "Generating..." : "Generate Prompt"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isLoading}
            size="lg"
          >
            {canUndo ? "Undo" : "Reset"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
