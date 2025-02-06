export default class Controller {
    #view
    #worker
    #events = {
        alive: () => { console.log("alive");},
        progress: ({total}) => {
            this.#view.updateProgress(total)
        },
        ocurrenceUpdate: ({found, linesLength, took}) => {
            const [[key, value]] = Object.entries(found)

            this.#view.updateDebugLog(
                `found ${value} ocurrencies of ${key} - over ${linesLength} lines - took: ${took}`
            )
        }
    }

    constructor({ view, worker }){
        this.#view = view        
        this.#worker = this.#configureWorker(worker)
    }

    static init(deps) {
        const controller = new Controller(deps)
        controller.init()
        return controller
    }

    init() {
        this.#view.configureOnFileChange(this.#configureOnFileChange.bind(this))
        this.#view.configureOnFormSubmit(this.#configureOnFormSubmit.bind(this))
    }

    #configureWorker(worker) {
        
        worker.onmessage = ({data}) => {
            console.log(data.eventType);
            this.#events[data.eventType](data)
        }

        return worker
    }

    #formtBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes'
    
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    
        const i = Math.floor(Math.log(bytes) / Math.log(k))
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    #configureOnFileChange(file) {  
        this.#view.setFileSize(this.#formtBytes(file.size))
    }

    #configureOnFormSubmit({description, file}) {
        const query = {}
        query["call description"] = new RegExp(
            description, 'i'
        )

        if(this.#view.isWorkerEnabled()) {
            this.#worker.postMessage({query, file})
            console.log("executing on worker thread");
            return
        }

        console.log("executing on main thread");
    } 
}

