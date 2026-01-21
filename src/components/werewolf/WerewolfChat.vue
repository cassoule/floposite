<template>
  <div class="werewolf-chat">
    <div class="chat-header">
      <h4>Chat</h4>
      <div class="channel-tabs">
        <button
          v-for="channel in channels"
          :key="channel"
          class="channel-tab"
          :class="{ active: activeChannel === channel }"
          @click="activeChannel = channel"
        >
          {{ getChannelName(channel) }}
          <span v-if="getUnreadCount(channel) > 0" class="unread-badge">
            {{ getUnreadCount(channel) }}
          </span>
        </button>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in filteredMessages"
        :key="index"
        class="chat-message"
        :class="message.channel"
      >
        <span class="message-author">{{ message.username }}:</span>
        <span class="message-content">{{ message.message }}</span>
        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
      </div>

      <div v-if="filteredMessages.length === 0" class="no-messages">
        Aucun message
      </div>
    </div>

    <div class="chat-input">
      <v-text-field
        v-model="newMessage"
        :placeholder="getPlaceholder()"
        variant="outlined"
        density="compact"
        hide-details
        @keyup.enter="sendMessage"
        :disabled="!canSend"
      >
        <template #append-inner>
          <v-btn
            icon
            variant="text"
            size="small"
            @click="sendMessage"
            :disabled="!newMessage.trim() || !canSend"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'

export default {
  name: 'WerewolfChat',

  props: {
    messages: {
      type: Array,
      default: () => []
    },
    channels: {
      type: Array,
      default: () => ['all']
    }
  },

  emits: ['send'],

  setup(props, { emit }) {
    const activeChannel = ref('all')
    const newMessage = ref('')
    const messagesContainer = ref(null)
    const readCounts = ref({})

    const filteredMessages = computed(() => {
      return props.messages.filter(m => {
        if (activeChannel.value === 'all') {
          return m.channel === 'all' || m.channel === 'system'
        }
        return m.channel === activeChannel.value
      })
    })

    const canSend = computed(() => {
      return props.channels.includes(activeChannel.value)
    })

    const getChannelName = (channel) => {
      const names = {
        all: 'Tous',
        werewolves: 'Loups',
        dead: 'Morts'
      }
      return names[channel] || channel
    }

    const getPlaceholder = () => {
      if (!canSend.value) {
        return 'Vous ne pouvez pas ecrire ici'
      }
      return `Message (${getChannelName(activeChannel.value)})...`
    }

    const getUnreadCount = (channel) => {
      const messagesInChannel = props.messages.filter(m => m.channel === channel)
      const readCount = readCounts.value[channel] || 0
      return Math.max(0, messagesInChannel.length - readCount)
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    const sendMessage = () => {
      if (!newMessage.value.trim() || !canSend.value) return

      emit('send', newMessage.value, activeChannel.value)
      newMessage.value = ''
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }

    // Watch for new messages
    watch(() => props.messages.length, () => {
      scrollToBottom()
    })

    // Update read count when switching channels
    watch(activeChannel, (newChannel) => {
      const messagesInChannel = props.messages.filter(m => m.channel === newChannel)
      readCounts.value[newChannel] = messagesInChannel.length
    })

    return {
      activeChannel,
      newMessage,
      messagesContainer,
      filteredMessages,
      canSend,
      getChannelName,
      getPlaceholder,
      getUnreadCount,
      formatTime,
      sendMessage
    }
  }
}
</script>

<style scoped>
.werewolf-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 200px;
  padding: 10px;
}

.chat-header {
  margin-bottom: 10px;
}

.chat-header h4 {
  margin-bottom: 8px;
  color: #aaa;
  font-size: 0.9em;
}

.channel-tabs {
  display: flex;
  gap: 5px;
}

.channel-tab {
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 15px;
  color: #888;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.channel-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.channel-tab.active {
  background: rgba(156, 39, 176, 0.3);
  color: #bb86fc;
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  font-size: 0.7em;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 10px;
  min-height: 100px;
  max-height: 200px;
}

.chat-message {
  padding: 5px 8px;
  margin-bottom: 5px;
  border-radius: 5px;
  font-size: 0.85em;
  background: rgba(255, 255, 255, 0.03);
}

.chat-message.werewolves {
  background: rgba(244, 67, 54, 0.1);
  border-left: 2px solid #f44336;
}

.chat-message.dead {
  background: rgba(158, 158, 158, 0.1);
  border-left: 2px solid #9e9e9e;
  font-style: italic;
}

.chat-message.system {
  background: rgba(156, 39, 176, 0.1);
  border-left: 2px solid #9c27b0;
  font-style: italic;
}

.message-author {
  font-weight: 600;
  color: #bb86fc;
  margin-right: 5px;
}

.message-content {
  color: #ddd;
}

.message-time {
  float: right;
  font-size: 0.75em;
  color: #666;
}

.no-messages {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.chat-input {
  margin-top: auto;
}
</style>
