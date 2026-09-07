import { useState } from '#app'

const useToast = () => {
  const timeoutRef = useRef<number | null>(null)
  const [toast, setToast] = useState({
    visible: false,
    title: '',
    description: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
  })

  const show = (params: {
    title: string
    description: string
    type?: 'success' | 'error' | 'info' | 'warning'
    duration?: number
  }) => {
    setToast({
      visible: true,
      title: params.title,
      description: params.description,
      type: params.type ?? 'info',
    })

    clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setToast({ visible: false, title: '', description: '', type: 'info' })
    }, params.duration ?? 5000)
  }

  const dismiss = () => {
    setToast({ visible: false, title: '', description: '', type: 'info' })
    clearTimeout(timeoutRef.current)
  }

  return { toast, show, dismiss }
}

export default useToast