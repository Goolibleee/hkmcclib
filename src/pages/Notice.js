import React, { useEffect, useState } from "react";
import "./Page.css"
import { useQuery, useLazyQuery } from "@apollo/client";
import { SEARCH_PER_SCREEN } from "../Util";
import { useParams, Link } from "react-router-dom";
import ListView from "../ListView";
import {NOTICE_QUERY, CONTENT_QUERY} from "../api/query.js";

function Notice(props) {
    const [searchResults, setSearchResults] = useState([]);
    const [displayedCodes, setDisplayedCodes] = useState([]);
    const [pageNum, setPageNum] = useState(0);
    const { loading: noticeLoading, data: noticeData, error: noticeError } = useQuery(NOTICE_QUERY);
    const { id } = useParams();
    const [loadSelected, { loading: selectedLoading, data: selectedData, error: selectedError}] = useLazyQuery(CONTENT_QUERY,
            {"variables": {"_id": id}});

    useEffect(function () {
        async function initialize() {
            console.log("Notice");
            props.doc.setCallback(undefined);
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("Get Notice");
//            console.log(noticeData);
//            console.log(noticeError);
//            console.log(noticeLoading);
            if (noticeData)
            {
                setSearchResults(noticeData.notice);
            }
        }, [noticeData, noticeError, noticeLoading]
    );

    useEffect(
        () => {
            console.log("Get Content");
//            console.log(selectedData);
//            console.log(selectedError);
//            console.log(selectedLoading);
            if (selectedData)
            {
//                setSearchResults(selectedData.content);
            }
        }, [selectedData, selectedError, selectedLoading]
    );

    useEffect(
        () => {
            const length = searchResults.length;
            console.log("Page num " + pageNum.toString() + " ");
            console.log(length);
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

    useEffect(
        () => {
//           console.log(displayedCodes);
        }, [displayedCodes]
    );

    useEffect(
        () => {
            console.log("Select id: " + id);
            if (id)
            {
                loadSelected();
            }
        }, [id, loadSelected]
    );

    const showEntries = (entries) => {
        return (
            <div id="noticeList">
                <table><tbody>
                   {displayedCodes.length > 0 && displayedCodes.map((result) => showEntry(result))}
                </tbody></table>
            </div>
        );
    }

    const showEntry = (result) => {
//        console.log(result);
        return (
                <tr className="" key={result._id}>
                    <td className=""> {result.date} </td>
                    <td className="noticeEntry" colSpan="2">
                        {id !== result._id &&
                            (<Link to={"/notice/"+result._id}>{result.title}</Link>)}
                        {id === result._id &&
                            (<Link to={"/notice"}>{result.title}</Link>)}
                    </td>
                </tr>
        );
    }

    return (
            <div id="notice">
                <div id="title">
                    <h2>
                        {props.text.notice}
                    </h2>
                </div>
                {id && selectedData &&
                    <div id="noticeContent">
                        <table className="content"><tbody>
                               {showEntry(selectedData.notice[0])}
                            <tr>
                                <td className="content" colSpan="3">
                                    {selectedData.notice[0].content}
                                </td>
                            </tr>
                        </tbody></table>
                    </div>
                }
                <ListView list={searchResults} showCallback={(entries) => { return showEntries(entries); }}/>
            </div>
            );
}

export default Notice;
