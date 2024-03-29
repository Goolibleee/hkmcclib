import React, { useEffect, useState, useRef } from "react";
import "./Page.css"
import { useDebounce } from "use-debounce";
import { MAX_SEARCH_ENTRY, getBookState, toUtf8 } from "../Util";
import { useParams } from "react-router-dom";
import ListView from "../ListView";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

let initialized = false;

function Search(props) {
    const [inputText, setInputText] = useState("");
    const [searchQuery] = useDebounce(inputText, 300);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedId, setSelectedId] = useState(0);
    const selectedRef = useRef("0");

    const [bookList, setBookList] = useState([]);
    const [rentList, setRentList] = useState([]);

    const [bookState, setBookState] = useState(0);
    const bookStateRef = useRef(0);
    const [needConfirm, setNeedConfirm] = useState(false);
    const needConfirmRef = useRef(false);

    const [queryRequest, toggleQueryRequest] = useState(false);

    const { id } = useParams();

    const [advancedSearch, setAdvancedSearch] = useState(false);

    const [author, setAuthor] = useState("");
    const [fromId, setFromId] = useState("");
    const [toId, setToId] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [stateFilter, setStateFilter] = useState(0);

    useEffect(function () {
        async function initialize() {
            if (props.doc.isOpen())
                updateDoc();
            else
                props.doc.setCallback(updateDoc);
            if (props.doc.serverAvailable)
            {
                import("./PageServer.css");
            }
            console.log("BOOK ID: " + id);
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("Updated id: " + id);
            if (id)
            {
                setInputText(id);
            }
            else
            {
                setInputText("");
            }
        }, [id]
    );

    useEffect(
        () => {
            async function findBooks(text) {
                let results = [];

                if (props.doc.serverAvailable)
                {
                    console.log(toUtf8(text));
                    console.log(btoa(toUtf8(text)));
                    const url = "https://" + props.doc.serverInfo.localIp + ":" +
                        props.doc.serverInfo.port + "/book";
                    console.log("=======================");
                    console.log("Request book list");
                    const param = {"book": btoa(toUtf8(text)), "match":false};
                    const response = await props.doc.requestGet(url, param);
                    console.log(response)
                    if (!("books" in response.data.return))
                        return results;
                    const books = response.data.return.books;
                    for (let i = 0 ; i < books.length ; i++)
                    {
                        const book = books[i];
                        const resultString = `${book.BOOKNAME} ${book.CLAIMNUM}`;
                        const state = book._STATE;
                        let retDate = "";
                        if (state === 1 || state === 3 || state === "1" || state === "3")
                        {
                            retDate = props.text.returnDate + " " + book._RETURN;
                        }
                        let resultObject = {
                            index: i,
                            text: resultString,
                            name: book.BOOKNAME,
                            code: book.BARCODE,
                            rent: getBookState(props.text, book._STATE.toString()),
                            retDate: retDate,
                            regDate: book.REG_DATE,
                            author: book.AUTHOR,
                            totalName: book.TOTAL_NAME,
                            claim_num: book.CLAMENUM,
                            publish: book.PUBLISH,
                            claim: book.CLAIM,
                            state: book._STATE,
                            isbn: book.ISBN
                        };
                        results.push(resultObject);
                    }
                }
                else
                {
                    results = findBookLocally(bookList);
                }
                results.sort(function(a,b) { return a['text'] > b['text']; });
                return results;
            }
            async function query() {
                console.log("Refresh");
                if (advancedSearch) {
                    return;
                }
                if (searchQuery) {
                    let sr = await findBooks(searchQuery);
                    if (sr.length > 0)
                        setSearchResults(sr);
                    else
                        setSearchResults([]);
                    if (sr.length === 1)
                        selectedRef.current = sr[0].code;
                } else {
                    setSearchResults([]);
                }
            }
            query();
        },
        [searchQuery, bookList, rentList, props, queryRequest, advancedSearch]
    );

    async function updateDoc()
    {
        console.log("All data loaded " + initialized);
        initialized = true;

        let rl = [];
        let rm = {};
        const rented = props.doc.rent;
        for (let i = 0 ; i < rented.length; i++)
        {
           rl.push({code:rented[i].book_id, retDate:rented[i].return_date, state:rented[i].state});
           rm[rented[i].book_id] = rented[i].state;
        }
        setRentList(rl);

        let bl = [];
        const books = props.doc.book
        var lastKey;
        for (const key in books)
        {
           const book = books[key];
           const state = (key in rm) ? rm[key] : 0;
           bl.push({code: book._id, name: book.title, state: state, num: book.num, author: book.author, claim: book.claim,
                    regDate: book.registration_date,
                    claim_num: book.claim_num, totalName: book.series, category: book.publisher, publish: book.publisher, isbn: book.isbn});
            lastKey = key;
        }
        console.log(books[lastKey])
        console.log("Load");
        console.log(books.length);
        setBookList(bl);
    }

    const selectId = async (code) => {
        console.log("Prev " + selectedRef.current);
        if (selectedRef.current === -1 || selectedRef.current !== code)
        {
            console.log("Select " + code);
            setSelectedId(code);
            selectedRef.current = code;
        }
        else
        {
            console.log("Deselect " + code);
            setSelectedId(-1);
            selectedRef.current = -1;
        }
    }

    function setState(state)
    {
        console.log("Set state " + state.toString());
        needConfirmRef.current = true;
        setNeedConfirm(true);
        setBookState(state);
        bookStateRef.current = state;
        console.log(selectedId.toString() + needConfirmRef.current);
    }

    function setSearchState(state)
    {
        const stateStr = state.toString()
        const value = document.getElementById(stateStr).checked;
        console.log("Set Search state " + stateStr + " Value: " + value);
        if (stateStr === "1023")
        {
            document.getElementById("1023").checked = value;
            document.getElementById("0").checked = value;
            document.getElementById("1").checked = value;
            document.getElementById("3").checked = value;
            document.getElementById("4").checked = value;
            document.getElementById("5").checked = value;
            document.getElementById("6").checked = value;
            document.getElementById("7").checked = value;
            document.getElementById("8").checked = value;
        }
        else
        {
            document.getElementById(stateStr).checked = value;
        }

        var filter = 0;
        for (var i = 0 ; i < 9 ; i++)
        {
            const idx = i.toString();
            const element = document.getElementById(idx);
            if (element)
                filter |= (element.checked) ? (1 << i) : 0;
        }
        setStateFilter(filter);
        console.log("Filter: " + filter.toString());
    }

    async function confirmAction()
    {
        console.log("Confirmed");
        needConfirmRef.current = false;
        setNeedConfirm(false);

        const ipAddr = props.doc.serverInfo.localIp;
        const portNum = props.doc.serverInfo.port;
        if (ipAddr.length === 0 || portNum <= 0)
            return;

        const url = "https://" + ipAddr + ":" +
            portNum + "/book";
        var obj = {};
        obj["book"] = selectedRef.current;
        obj["state"] = bookStateRef.current;
        console.log("=======================");
        console.log("Change book state");
        await props.doc.requestPost(url, obj);

        toggleQueryRequest(!queryRequest);
    }

    function cancelAction()
    {
        console.log("Cancelled");
        needConfirmRef.current = false;
        setNeedConfirm(false);
    }

    const showEntry = (result) => {
        const hidden = (result.code !== selectedRef.current);
        const entryId = (hidden) ? "searchResult" : "selectedSearchResult";
        const flags = [false, false, false, false, false, false, false, false, false, false]
        flags[result.state] = true;
        if (result.state === 1 || result.state === 2 || result.state === 3)
            flags[0] = true;
        if (!hidden)
            console.log(flags)
        return (
            <div key={result.code}>
            <div id={entryId} onClick={async () => await selectId(result.code)}>
                <table><tbody>
                    <tr className="searchTr">
                        <td className="searchTitle"> {result.text}</td>
                        <td className="searchRent"> {result.rent} </td>
                    </tr>
                </tbody></table>
            </div>
            {!hidden &&
            <div>
                <table><tbody>
                <tr>
                    <td>{result.author} </td>
                    <td colSpan="2" rowSpan="2">{result.totalName} <b>{result.name}</b> { result.claim_num} </td>
                </tr>
                <tr>
                    <td>{result.code} </td>
                </tr>
                <tr>
                    <td>{result.publish}</td>
                    <td colSpan={result.retDate.length > 0 ? "1":"2"}>{result.claim} </td>
                    {result.retDate.length > 0 && <td>{result.retDate}</td> }
                </tr>
                </tbody></table>
                <div hidden={!props.doc.serverAvailable || !props.doc.admin}>
                    <button className="bookStates" id = "0" disabled={flags[0]} onClick={() => setState(0)}> {props.text.available} </button>
                    <button className="bookStates" id = "4" disabled={flags[4]} onClick={() => setState(4)}> {props.text.lost} </button>
                    <button className="bookStates" id = "5" disabled={flags[5]} onClick={() => setState(5)}> {props.text.damaged} </button>
                    <button className="bookStates" id = "6" disabled={flags[6]} onClick={() => setState(6)}> {props.text.given} </button>
                    <button className="bookStates" id = "7" disabled={flags[7]} onClick={() => setState(7)}> {props.text.notAvailable} </button>
                    <button className="bookStates" id = "8" disabled={flags[8]} onClick={() => setState(8)}> {props.text.deleted} </button>
                </div>
                <div id="checkRent" hidden={!needConfirmRef.current}>
                    <div id="bookName"> {getBookState(props.text, bookStateRef.current)} </div>
                    <button id="confirm" onClick={() => confirmAction()}> {props.text.confirm} </button>
                    <button id="cancel" onClick={() => cancelAction()}> {props.text.cancel} </button>
                </div>
            </div>
            }
            </div>
        );
    }

    function showEntries(results)
    {
        console.log("Redraw " + needConfirmRef.current);
        return results.map((result) => showEntry(result))
    }

    function setPeriod(from, text)
    {
        if (from)
            setFromId(text)
        else
            setToId(text)
    }

    function findBookLocally(bookList)
    {
        let results = [];
        console.log(advancedSearch);
        for (let i = 0 ; i < bookList.length ; i++) {
            const row = bookList[i];
            if (results.length >= MAX_SEARCH_ENTRY) break;

            const text = inputText;
            if (text.length > 0 && row.name && !row.name.toString().includes(text) &&
                row.code !== text && row.isbn !== text)
                continue
            if (advancedSearch)
            {
                if (author.length > 0 && row.author && !row.author.toString().includes(author))
                    continue;

                if (fromId.length > 0 && row.code < fromId)
                    continue;

                if (toId.length > 0 && row.code > toId)
                    continue;

                const regDate = row.regDate;

                if (regDate < fromDate || regDate > toDate)
                    continue;
                console.log(row);
                console.log(regDate);
                console.log(regDate < fromDate);
                console.log(regDate > toDate);

                if (!(1<<(row.state) & stateFilter))
                    continue;
            }
            else if (text.length == 0)
                continue;

            let resultString = `${row.name} ${row.claim_num}`;
            let retDate = "";
            let state = "0";
            for (const entry of rentList)
            {
                if (entry.code === row.code)
                {
                    state = entry.state;
                    if (state === "1" || state === "3")
                    {
                        retDate = props.text.returnDate + " " + entry.retDate;
                    }
                    break;
                }
            }
            let resultObject = {
                index: i,
                text: resultString,
                name: row.name,
                code: row.code.toString(),
                rent: getBookState(props.text, state),
                retDate: retDate,
                regDate: row.regDate,
                author: row.author,
                totalName: row.totalName,
                claim_num: row.claim_num,
                publish: row.publish,
                claim: row.claim,
                state: parseInt(state),
                isbn: row.isbn
            };
            results.push(resultObject);
//            console.log(resultObject);
        }
        console.log(results.length);

        return results;
    }

    function onChangeDate(date)
    {
        console.log(date);
        const date1 = date[0]
        const date2 = date[1]
        const y1 = date1.getFullYear().toString();
        const m1 = (date1.getMonth() + 1).toString().padStart(2, "0")
        const d1 = date1.getDate().toString().padStart(2, "0");
        const dateStr1 = y1 + "-" + m1 + "-" + d1;
        console.log(dateStr1);
        setFromDate(dateStr1);

        const y2 = date2.getFullYear().toString();
        const m2 = (date2.getMonth() + 1).toString().padStart(2, "0")
        const d2 = date2.getDate().toString().padStart(2, "0");
        const dateStr2 = y2 + "-" + m2 + "-" + d2;
        console.log(dateStr2);
        setToDate(dateStr2);
    }

    function searchEntry()
    {
        console.log("Search");
        console.log(fromId);
        console.log(toId);
        console.log(fromDate);
        console.log(toDate);
        let results = findBookLocally(bookList);
        results.sort(function(a,b) { return a['code'] > b['code']; });

        let sr = results;
        if (sr.length > 0)
            setSearchResults(sr);
        else
            setSearchResults([]);
        if (sr.length === 1)
            selectedRef.current = sr[0].code;
    }

    function toggleAdvancedSearch()
    {
        setAdvancedSearch(!advancedSearch);
    }

    return (
        <div id="search">
            <div id="title">
                <h2> {props.text.bookSearch} </h2>
            </div>
            <div id="searchContents">
                <input id="searchInput"
                    placeholder={props.text.searchBook}
                    value={inputText}
                    onChange={(event) => {
                        setInputText(event.target.value);
                    }} />
                    <div hidden={!props.doc.admin}>
                        <input type="checkbox" id="advancedSearch" checked={advancedSearch} onChange={() => toggleAdvancedSearch()}/>
                        <label>
                            {props.text.advSearch}
                        </label>
                    </div>
                <div hidden={!advancedSearch}>
                    <div>
                    <label> {props.text.author} </label>
                    <input type="text" id="author" onChange={(event) => {setAuthor(event.target.value)}} />
                    </div>
                    <div>
                    <label> {props.text.bookCode} </label>
                    <input type="text" id="fromPeriod" onChange={(event) => {setPeriod(true, event.target.value);}} />
                    <label> ~  </label>
                    <input type="text" id="toPeriod" onChange={(event) => {setPeriod(false, event.target.value);}} />
                    </div>
                    <div>
                    <label> {props.text.registeredDate} </label>
                    <Calendar onChange={onChangeDate} selectRange="true"/>
                    </div>
                    <div>
                    <table><tbody>
                        <tr key="stateName" className="bookData">
                            <td className ="stateName"> {props.text.all} </td>
                            <td className ="stateName"> {props.text.available} </td>
                            <td className ="stateName"> {props.text.checkedOut} </td>
                            <td className ="stateName"> {props.text.overDue} </td>
                            <td className ="stateName"> {props.text.lost} </td>
                            <td className ="stateName"> {props.text.damaged} </td>
                            <td className ="stateName"> {props.text.given} </td>
                            <td className ="stateName"> {props.text.notAvailable} </td>
                            <td className ="stateName"> {props.text.deleted} </td>
                        </tr>
                        <tr key="stateButton" className="bookData">
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "1023" onChange={() => setSearchState(1023)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "0" onChange={() => setSearchState(0)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "1" onChange={() => setSearchState(1)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "3" onChange={() => setSearchState(3)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "4" onChange={() => setSearchState(4)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "5" onChange={() => setSearchState(5)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "6" onChange={() => setSearchState(6)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "7" onChange={() => setSearchState(7)}/>
                            </td>
                            <td className ="stateButton">
                            <input type="checkbox" className="bookStates" id = "8" onChange={() => setSearchState(8)}/>
                            </td>
                        </tr>
                    </tbody></table>
                    </div>
                    <div>
                    <button id="searchEntry" onClick={searchEntry}> {props.text.search} </button>
                    </div>
                </div>
            </div>
            <ListView keyValue={searchQuery} list={searchResults} detail={selectedId + needConfirm} showCallback={(entries, detail) => { return showEntries(entries); }}/>
        </div>
    );
}

export default Search;
