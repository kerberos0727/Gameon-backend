function makeRequestWithToken(url, method, data) {
    const token = getAuthToken()
    if (token) {
        return $.ajax({
            url,
            type: method.toUpperCase(),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            },
            data
        })
    } else {
        return null;
    }
}

function getSportsData() {
    return new Promise((resolve, reject) => {
        var request = makeRequestWithToken('/api/sports/all', 'GET')
        if (request) {
            request.done(data => {
                const temps = data.filter(item => (item.enable))
                resolve(temps)
            })
                .fail(error => {
                    reject(error)
                })
        } else {
            reject('NO_AUTH')
        }
    })
}

function getUniversityData() {
    return new Promise((resolve, reject) => {
        var request = makeRequestWithToken('/api/university/all', 'GET')
        if (request) {
            request.done(data => {
                const temps = data
                resolve(temps)
            })
                .fail(error => {
                    reject(error)
                })
        } else {
            reject('NO_AUTH')
        }
    })
}

function renderDropdown(items, selected) {
    var temp = items.map(item => {
        const checked = item.id == selected ? 'checked' : ''
        return `<option value="${item.id}" ${checked}>${item.title}</option>`
    })
    return temp.join('')
}

function errorHandler(xhr) {
    if (xhr.status == 401) {
        logout()
    } else {
        const { msg } = xhr.responseJSON.errors
        if (msg) {
            const messages =
                Array.isArray(msg)
                    ? msg.map((err) => `'${err.param}' - ${err.msg}`)
                    : msg
            $.toast({
                heading: 'Error',
                text: messages,
                icon: 'error',
                position: 'top-center'
            })
        }
    }
}

function successMsg(msg) {
    $.toast({
        heading: 'Success',
        text: msg,
        icon: 'success',
        position: 'top-center'
    })
}

function infoMsg(msg) {
    $.toast({
        heading: 'Information',
        icon: 'info',
        text: msg,
        icon: 'success',
        position: 'top-center'
    })
}

function errorMsg(msg) {
    $.toast({
        heading: 'Error',
        text: msg,
        icon: 'error',
        position: 'top-center'
    })
}

function getGeoLocation(address) {
    return new Promise((resolve, reject) => {
        if (GOOGLE_API_KEY) {
            $.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=` + GOOGLE_API_KEY)
                .done(res => {
                    if (res.status == 'OK') {
                        resolve({
                            ...res.results[0].geometry.location,
                            address: res.results[0].formatted_address
                        })
                    } else {
                        resolve(null)
                    }
                })
                .fail(error => {
                    console.log(error)
                    resolve(null)
                })
        } else {
            resolve(null)
        }
    })
}