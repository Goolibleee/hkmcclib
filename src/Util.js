export const SEARCH_PER_SCREEN = 10;
export const MAX_SEARCH_ENTRY = 500;

export const sleep = (time) => {
   return new Promise((resolve) => setTimeout(resolve, Math.ceil(time * 1000)));
};

interface String
{
    format: () => String;
}

// eslint-disable-next-line no-extend-native
String.prototype.format = function() {
    let formatted = this;
    for (let i = 0; i < arguments.length; i++) {
        let regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
}

export const toastProp = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined
}

export const getUserState = function(text, state) {
    if (state === "0" || state === 0)
        return text.normal;
    else if (state === "1" || state === 1)
        return text.overDue;
    else if (state === "2" || state === 2)
        return text.stopped;
}

export const getBookState = function(text, state) {
    if (state === "0")
    {
        return text.available;
    }
    else if (state === "1")
    {
        return text.checkedOut;
    }
    else if (state === "3")
    {
        return text.overDue;
    }
    else
    {
        return text.notAvailable;
    }
}

export const compareRent = function(a1, a2)
{
    if (a1.rentDate > a2.rentDate)
        return true;
    else if (a1.rentDate < a2.rentDate)
        return false;
    return a1.title > a2.title;
}

export const toUtf8 = function(text) {
    return unescape(encodeURIComponent(text));
};

export const fromUtf8 = function(text) {
    return decodeURIComponent(escape(text));
};

export const loadingId = "custom-loading-id";
export const loggingId = "custom-logging-id";
