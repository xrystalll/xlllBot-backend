const path = require('path')
const { checkSettings } = require(path.join(__dirname, '..', 'Utils'))
const client = require(path.join(__dirname, '..', 'client'))
const VideosDB = require(path.join(__dirname, '..', 'models', 'VideosDB'))
const ytInfo = require('updated-youtube-info')
const cachegoose = require('cachegoose')

const addVideo = (channel, state, args, io) => {
  checkSettings(channel, 'songrequest').then(bool => {
    if (bool) {
      const checkUrl = (url) => url.match(/^.*((youtu.be\/)|(v\/)|(\/\w\/)|(watch\?))\??v?=?([^#\&\?]*).*/g) != null;
      const youtubeId = (url) => {
        const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/)
        return (match && match[7].length === 11) ? match[7] : false
      }

      const url = args[0]

      if (!url) return
      if (!checkUrl(url)) return

      const ytId = youtubeId(url)
      if (!ytId) return

      checkSettings(channel, 'songforunsub').then(setting => {
        if (setting) {
          ytInfo(ytId)
            .then(ytData => {
              const vidObj = {
                yid: ytData.videoId, 
                url: ytData.url,
                channel,
                title: ytData.title,
                owner: ytData.owner,
                views: ytData.views,
                duration: ytData.duration,
                thumb: ytData.thumbnailUrl
              }

              VideosDB.create(vidObj)
                .then(data => {
                  cachegoose.clearCache('cache-all-videos-for-' + channel)
                  io.sockets.emit('new_video', data)
                  client.say(channel, `@${state.user.username} видео добавлено`)
                })
                .catch(error => console.error(error))
            })
            .catch(() => console.error('Video does exist'))
        } else {
          if (state.subscriber || state.mod || state.user.username === channel) {
            ytInfo(ytId)
              .then(ytData => {
                const vidObj = {
                  yid: ytData.videoId, 
                  url: ytData.url,
                  channel,
                  title: ytData.title,
                  owner: ytData.owner,
                  views: ytData.views,
                  duration: ytData.duration,
                  thumb: ytData.thumbnailUrl
                }

                VideosDB.create(vidObj)
                  .then(data => {
                    cachegoose.clearCache('cache-all-videos-for-' + channel)
                    io.sockets.emit('new_video', data)
                    client.say(channel, `@${state.user.username} видео добавлено`)
                  })
                  .catch(error => console.error(error))
              })
              .catch(() => console.error('Video does exist'))
          }
        }
      })
    } else client.say(channel, 'Возможность заказывать видео выключена!')
  })
}

const skipVideo = (channel, io) => {
  io.sockets.emit('skip', { channel })
}

module.exports = { addVideo, skipVideo }
