import { create } from 'zustand'
import Vapi from '@vapi-ai/web'
import { CreateAssistantDTO } from '@vapi-ai/web/dist/api'

export type CallState = 'idle' | 'connecting' | 'active' | 'error'

// Constants for timeouts and retries
const CALL_TIMEOUT_MS = 10000 // 10 seconds
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000 // 1 second

interface CallStateStore {
  // State
  state: CallState
  currentCallId: string | null
  error: Error | null
  activeButtonId: string | null
  client: Vapi | null
  muted: boolean

  // Actions
  initiateCall: (
    buttonId: string,
    apiKey: string,
    systemPrompt: string,
    context: { assistantName: string; companyName: string }
  ) => Promise<void>
  endCall: (buttonId: string) => Promise<void>
  handleError: (error: Error) => void
  resetState: () => void
  setMuted: (muted: boolean) => void
}

export const useCallState = create<CallStateStore>((set, get) => ({
  // Initial state
  state: 'idle',
  currentCallId: null,
  error: null,
  activeButtonId: null,
  client: null,
  muted: false,

  // Actions
  initiateCall: async (buttonId, apiKey, systemPrompt, context) => {
    const { state, activeButtonId, client } = get()

    // Validate state
    if (state !== 'idle' && state !== 'error') {
      throw new Error('Cannot start a new call while another call is in progress')
    }
    if (state === 'error' && activeButtonId !== buttonId) {
      throw new Error('Only the button that encountered an error can retry')
    }

    let retryCount = 0
    let lastError: Error | null = null

    while (retryCount <= MAX_RETRIES) {
      try {
        // Update state to connecting
        set({ state: 'connecting', activeButtonId: buttonId, error: null })

        // Clean up existing client if any
        if (client) {
          await get().endCall(buttonId)
        }

        // Create new client
        const newClient = new Vapi(apiKey)
        set({ client: newClient })

        // Set up call timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Call initialization timed out')), CALL_TIMEOUT_MS)
        })

        // Configure assistant
        const assistant: CreateAssistantDTO = {
          name: context.assistantName,
          voice: {
            provider: '11labs' as const,
            voiceId: 'JBFqnCBsd6RMkjVDRZzb' as const,
            stability: 0.6,
            similarityBoost: 0.75,
            fillerInjectionEnabled: false,
            optimizeStreamingLatency: 4,
          },
          model: {
            provider: 'openai' as const,
            model: 'gpt-4o' as const,
            messages: [
              { role: 'system' as const, content: systemPrompt }
            ]
          },
          firstMessage: `Hi, this is ${context.assistantName} from ${context.companyName}, is this the owner?`,
          transcriber: {
            provider: 'deepgram' as const,
            model: 'nova-2' as const,
            language: 'en' as const
          },
          metadata: {
            companyName: context.companyName,
          }
        }

        // Start call with timeout
        await Promise.race([
          newClient.start(assistant),
          timeoutPromise
        ])

        // Call started successfully
        set({ state: 'active' })
        return

      } catch (error) {
        lastError = error as Error
        retryCount++

        if (retryCount <= MAX_RETRIES) {
          // Clean up and wait before retry
          await get().resetState()
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
        }
      }
    }

    // All retries failed
    get().handleError(lastError || new Error('Failed to start call after retries'))
  },

  endCall: async (buttonId) => {
    const { state, activeButtonId, client } = get()

    if (state === 'idle') {
      return
    }

    if (activeButtonId !== buttonId) {
      throw new Error('Only the active button can end the call')
    }

    try {
      if (client) {
        await client.stop()
      }
    } catch (error) {
      console.error('Error stopping call:', error)
    } finally {
      get().resetState()
    }
  },

  handleError: (error: Error) => {
    set({ state: 'error', error })
  },

  resetState: () => {
    const { client } = get()
    
    // Clean up client if it exists
    if (client) {
      try {
        client.stop()
      } catch (error) {
        console.error('Error cleaning up client:', error)
      }
    }

    set({
      state: 'idle',
      currentCallId: null,
      error: null,
      activeButtonId: null,
      client: null
    })
  },

  setMuted: (muted: boolean) => {
    const { client } = get()
    if (client) {
      // TODO: Implement mute functionality when available in Vapi client
    }
    set({ muted })
  }
}))
