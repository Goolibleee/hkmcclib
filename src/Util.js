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
    console.log("Book state " + state);
    switch (state)
    {
        case "0":
        case 0:
            return text.available;
        case "1":
        case 1:
            return text.checkedOut;
        case "2":
        case 2:
            return text.reserved;
        case "3":
        case 3:
            return text.overDue;
        case "4":
        case 4:
            return text.lost;
        case "5":
        case 5:
            return text.damaged;
        case "6":
        case 6:
            return text.given;
        case "7":
        case 7:
        default:
            return text.notAvailable;
        case "8":
        case 8:
            return text.deleted;
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
