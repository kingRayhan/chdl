const Fs = require('fs')
const Path = require('path')
const Axios = require('axios')
const _progress = require('cli-progress')
const chalk = require('chalk')

require('dotenv').config()

Fs.mkdirSync(process.env.DL_DIR_NAME)

async function downloadVideo(startIndex, lastIndex) {
    let number = startIndex
    if (number === 0) {
        console.log('startIndex can not be 0')
        return
    }

    const url = `${process.env.VIDEO_UL_PREFIX}/lesson${number}.${process.env.VIDEO_EXT}`
    const path = Path.resolve(__dirname, process.env.DL_DIR_NAME, `lesson${number}.${process.env.VIDEO_EXT}`)
    const writer = Fs.createWriteStream(path)

    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream',
    })

    // Getting the whole content length
    const total = response.headers['content-length']

    // initialize the cli-progress
    let progress = 0
    const bar = new _progress.Bar(
        {
            barsize: 65,
            position: 'center',
            format: chalk.blue(`Downloading ${number} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} bytes`),
        },
        _progress.Presets.shades_grey
    )
    bar.start(total, 0)

    // Updating the progress cli on data
    response.data.on('data', chunk => {
        progress += chunk.length
        bar.update(progress)
    })

    // piping the data with the response
    response.data.pipe(writer)
    writer.on('finish', () => {
        bar.stop()
        console.log(chalk.green('Download completed', number))
        if (lastIndex !== number) {
            number++
            downloadVideo(number, lastIndex)
        }
    })
    writer.on('error', () => console.log('error'))
}
downloadVideo(process.env.START_INDEX, process.env.END_INDEX)
