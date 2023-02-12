import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import Logo from "../images/logo.png";
import { useDebounce } from "use-debounce";
import { sleep, toastProp, SEARCH_PER_SCREEN, MAX_SEARCH_ENTRY } from "../Util";
import text from "../api/text";

function Search(props) {
    const [inputText, setInputText] = useState("");
    const [searchQuery] = useDebounce(inputText, 50);
    const [searchResults, setSearchResults] = useState([]);
    const [displayedCodes, setDisplayedCodes] = useState([]);
    const [pageNum, setPageNum] = useState(0);

    const [bookList, setBookList] = useState([]);
    const [rentList, setRentList] = useState([]);

    useEffect(function () {
        async function initialize() {
            toast.dismiss();
            while (!props.doc.isOpen()) {
                await sleep(0.1);
            }

            const rentSheet = await props.doc.sheetsByTitle('rent');
            const bookSheet = await props.doc.sheetsByTitle('book');

            if (!rentSheet || !bookSheet)
            {
                const prop = toastProp;
                prop.autoClose = 3000;
                toast.error(text.failedToOpen, prop);
                return;
            }
            const cachedRentData = props.doc.getCachedList("rent");
            const cachedBookData = props.doc.getCachedList("book");
            console.log("Cached data");
            console.log(cachedRentData);
            console.log(cachedBookData);
            let initNoti = null;
            if (!cachedRentData.has(rentSheet.header.barcode.toString()) ||
                !cachedBookData.has(bookSheet.header.barcode.toString()) ||
                !cachedBookData.has(bookSheet.header.name.toString()))
            {
                console.log("Data should be loaded");
                const prop = toastProp;
                prop.autoClose = false;
                initNoti = toast.info(text.loading, prop);
            }

            let rentLists;
            rentLists = await props.doc.readList("rent", [rentSheet.header.barcode]);
            console.log(rentLists);
            const rented = rentLists[0];

            let bookLists;
            bookLists = await props.doc.readList("book", [bookSheet.header.barcode,
                                                          bookSheet.header.name]);
            const bookCodes = bookLists[0];
            const bookNames = bookLists[1];

            let rl = [];
            for (let i = 0 ; i < rented.length; i++)
            {
               rl.push(rented[i]);
            }
            setRentList(rl);
            console.log("rentList");
            console.log(rl);

            let bl = [];
            for (let i = 0 ; i < bookCodes.length; i++)
            {
               bl.push({code: bookCodes[i], name: bookNames[i]})
            }
            setBookList(bl);

            if (initNoti) {
                const prop = toastProp;
                prop.type = toast.TYPE.SUCCESS;
                prop.render = text.succeededToOpen;
                prop.autoClose = 3000;
                toast.update(initNoti, prop);
            }
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            async function findBooks(text) {
                let results = [];

                for (const row of bookList) {
                    if (results.length >= MAX_SEARCH_ENTRY) break;
                    if (row.name && row.name.toString().includes(text))
                    {
                        let resultString = `${row.name}`;
                        console.log(row.code);
                        let rent = ""
                        if (rentList.includes(row.code))
                            rent = props.text.checkedOut;
                        let resultObject = {
                            text: resultString,
                            name: row.name,
                            code: row.code.toString(),
                            rent: rent
                        };
                        results.push(resultObject);
                    }
                }
                return results;
            }
            async function query() {
                if (searchQuery) {
                    let sr = await findBooks(searchQuery);
                    if (sr.length > 0) setSearchResults(sr);
                } else {
                    setSearchResults([]);
                }
            }
            query();
        },
        [searchQuery, bookList, rentList, props]
    );

    useEffect(
        () => {
            const length = searchResults.length;
                console.log("Page num " + pageNum.toString);
            if (length > SEARCH_PER_SCREEN)
            {
                const startIdx = pageNum * SEARCH_PER_SCREEN;
                const count = Math.min(SEARCH_PER_SCREEN, length - startIdx);
                setDisplayedCodes(searchResults.slice(startIdx,startIdx+count));
            }
            else
            {
                setDisplayedCodes(searchResults);
                setPageNum(0);
            }
        }, [searchResults, pageNum]
    );

    function movePrev() {
        if (pageNum > 0)
        {
            setPageNum(pageNum - 1);
        }
    }

    function moveNext() {
        if (searchResults.length > (pageNum + 1) * SEARCH_PER_SCREEN)
        {
            setPageNum(pageNum + 1);
        }
    }

    return (
        <div id="search">
            <div id="title">
                <img id="logo" src={Logo} alt="HKMCC" ></img>
                <h1> {props.text.searchTitle} </h1>
            </div>
            <div id="searchContents" >
                <input id="search"
                    placeholder={props.text.searchBook}
                    value={inputText}
                    onChange={(event) => {
                        setInputText(event.target.value);
                    }} />

                {displayedCodes.map((result) => {
                    return (
                        <div key={result.code} id="searchResult">
                        <table><tbody><tr>
                            <td> {result.text}</td><td> {result.rent} </td>
                        </tr></tbody></table>
                        </div>
                    );
                })}
            </div>
            {searchResults.length > SEARCH_PER_SCREEN && (
                <div id="pageControl" hidden={searchResults.length <= SEARCH_PER_SCREEN}>
                    <button id="prevPage" onClick={movePrev}> &lt;&lt; </button>
                    <p id="pageNum"> {pageNum+1} </p>
                    <button id="nextPage" onClick={moveNext}> &gt;&gt; </button>
                </div>
            )}
        </div>
    );
}

export default Search;
