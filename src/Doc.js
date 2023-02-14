import { toast } from "react-toastify";

class Doc {
    constructor() {
        console.log("Create Doc class");
        this.initialized = false;
        this.bookReady = false;
        this.rentReady = false;
        this.logged = false;
        this.userInfo = {};
        this.book = {};
        this.rent = {};
    }

    checkState() {
        if (this.bookReady && this.rentReady) {
            this.initialized = true;
            if (this.callback) {
                toast.dismiss();
                this.callback();
            }
        }

    }

    setRent(rent) {
        this.rent = rent
        this.rentReady = true;
        this.checkState();
    }

    setBook(books) {
        this.book = {};
        for (let i = 0 ; i < books.length ; i++)
        {
            const book = books[i];
            const id = book['_id'];
            this.book[id] = book;
        }
        this.bookReady = true;
        this.checkState();
    }

    logIn(userInfo) {
        console.log("Logged in: " + userInfo['_id']);
        this.logged = true;
        this.userInfo = userInfo;
    }

    logOut() {
        console.log("Logged out");
        this.logged = false;
        this.userInfo = {};
    }

    getRent(userId) {
        let ret = [];
        console.log("Check " + userId);
//        console.log(this.rent.length);
        for (let i = 0 ; i < this.rent.length ; i++) {
            const entry = this.rent[i];
            if (entry["user_id"] !== userId)
                continue;
//            console.log(entry);
            const id = entry["book_id"];
            const book = this.book[id];
//            console.log(book)
            let retEntry = {}
            retEntry["id"] = book["_id"];
            retEntry["title"] = book["title"];
            retEntry["rentDate"] = entry["rent_date"].split(" ")[0].replace("-","/",2).replace("-", "/")
            retEntry["retDate"] = entry["return_date"].split(" ")[0].replace("-","/",2).replace("-", "/")
            ret.push(retEntry)
        }
        return ret;
    }

    async openDoc() {
        try {
            this.initialized = true;
        }
        catch (error)
        {
            console.log(error);
            return false;
        }
        return true;
    }

    isOpen() {
        return this.initialized;
    }

    setCallback(updateFunc)
    {
        console.log("Update function registered");
        this.callback = updateFunc;
    }
}

export default Doc;

