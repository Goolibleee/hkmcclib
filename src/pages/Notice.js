import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { toastProp } from "../Util";
import "./Page.css"
import { useQuery, useLazyQuery } from "@apollo/client";
import { SEARCH_PER_SCREEN } from "../Util";
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {NOTICE_QUERY, CONTENT_QUERY} from "../api/query.js";

function Notice(props) {
    const [searchResults, setSearchResults] = useState([]);
    const [displayedCodes, setDisplayedCodes] = useState([]);
    const [pageNum, setPageNum] = useState(0);
    const [selectedId, setSelectedId] = useState(-1);
    const { loading: noticeLoading, data: noticeData, error: noticeError } = useQuery(NOTICE_QUERY);
    const [loadSelected, { loading: selectedLoading, data: selectedData, error: selectedError}] = useLazyQuery(CONTENT_QUERY,
            {"variables": {"_id": selectedId}});

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
                setSearchResults(noticeData.notices);
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

    const selectEntry = (id) => {
        console.log("selected " + id.toString());
        if (selectedId === id)
        {
            setSelectedId(-1);
        }
        else
        {
            setSelectedId(id);
        }
        loadSelected();
    }

    const showEntry = (result) => {
//        console.log(result);
        return (
                <tr className="" key={result._id}>
                    <td className=""> {result.date} </td>
                    <td className="noticeEntry" colSpan="2" onClick={() => selectEntry(result._id)}> {result.title}</td>
                </tr>
        );
    }

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
            <div id="notice">
                <div id="title">
                    <h2>
                        {props.text.notice}
                    </h2>
                </div>
                {selectedId > 0 && selectedData &&
                <div id="noticeContent">
                    <table className="content"><tbody>
                           {showEntry(selectedData.notice)}
                        <tr>
                            <td className="content" colSpan="3">
                                {selectedData.notice.content}
                            </td>
                        </tr>
                    </tbody></table>
                </div>
                }
                <div id="noticeList">
                    <table><tbody>
                       {displayedCodes.length > 0 && displayedCodes.map((result) => showEntry(result))}
                    </tbody></table>
                </div>
                {searchResults.length > SEARCH_PER_SCREEN && (
                    <div id="pageControl">
                        <div className="page" id = "page">
                            <NavigateBeforeIcon fontSize="large" sx={{color: (pageNum === 0) ? "#ffffff":"#404040"}} onClick={movePrev}/>
                        </div>
                        <div className="pageNum" id="pageNum">
                            {pageNum+1}
                        </div>
                        <div className="page" id = "page">
                            <NavigateNextIcon fontSize="large" sx={{color: (searchResults.length <= (pageNum + 1) * SEARCH_PER_SCREEN) ? "#ffffff":"#404040"}} onClick={moveNext}/>
                        </div>
                    </div>
                )}
            </div>
            );
}

export default Notice;
