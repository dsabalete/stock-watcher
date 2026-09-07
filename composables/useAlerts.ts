import { ref, computed } from 'vue'
import type { AlertConfig } from './useWatchlist'

export const useBrowserNotifications = () => {
  const permission = ref<NotificationPermission>('default')

  if (typeof window !== 'undefined') {
    permission.value = Notification.permission
  }

  const requestPermission = async () => {
    if (typeof window === 'undefined') return
    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  const hasPermission = computed(() => permission.value === 'granted')

  const triggerNotification = (title: string, body: string) => {
    if (!hasPermission.value) return
    new Notification(title, { body })
  }

  const checkAndNotify = (stock: any, alertType: 'sell' | 'buy', alertConfig: AlertConfig) => {
    if (!hasPermission.value) return
    const price = Number(stock.price)
    const cfg = alertConfig

    if (alertType === 'sell' && cfg.above != null && price >= cfg.above) {
      triggerNotification(
        `🔔 ${stock.symbol} Sell Target Hit`,
        `Price $${price.toFixed(2)} reached or exceeded sell target $${cfg.above?.toFixed(2)}`
      )
    }
    if (alertType === 'buy' && cfg.below != null && price <= cfg.below) {
      triggerNotification(
        `🔔 ${stock.symbol} Buy Target Hit`,
        `Price $${price.toFixed(2)} reached or fallen below buy target $${cfg.below?.toFixed(2)}`
      )
    }
  }

  return {
    permission,
    requestPermission,
    hasPermission,
    triggerNotification,
    checkAndNotify,
  }
}