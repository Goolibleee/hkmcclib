import gql from "graphql-tag";

export const BOOK_QUERY = gql`
    query AllBook{
        book (limit:20000) {
            _id
            author
            title
            claim_num
            num
            series
            category
            claim
            publisher
            seqnum
            registration_date
            isbn
            deleted
        }
    }
`;

export const RENT_QUERY = gql`
    query AllRent{
        rent (limit:20000) {
            _id
            book_id
            user_id
            rent_date
            return_date
            extend_count
            state
        }
    }
`;

export const USERS_QUERY = gql`
    query AllUser {
        user (limit: 20000) {
            _id
            name
            state
            level
        }
    }`;

export const USER_QUERY = gql`
    query FindUser($_id: string){
        user (where: {_id: {_eq: $_id}}) {
            _id
            name
            state
            level
            encrypted_email
            encrypted_phone
        }
    }`;

export const HISTORY_QUERY = gql`
    query findLogs($user_id: string){
        rentLog (limit: 20000, where: {user_id: {_eq: $user_id}}) {
            _id
            book_id
            book_state
            timestamp
            return_date
            user_id
        }
    }`;

export const HISTORY_BOOK_QUERY = gql`
    query findLogs($book_id: string){
        rentLog (limit: 20000, where: {book_id: {_eq: $book_id}}) {
            _id
            book_id
            book_state
            timestamp
            return_date
            user_id
        }
    }`;

export const HISTORY_PERIOD_QUERY = gql`
    query findLogs ($fromTime: string, $toTime: string) {
        rentLog(limit: 20000, where: {timestamp: {_gte: $fromTime, _lt: $toTime}}) {
            _id
            book_id
            book_state
            timestamp
            return_date
            user_id
        }
    }`;

export const NOTICE_QUERY = gql`
    query GetNotices {
        notice (order_by: {date: asc}, limit:20000) {
            _id
            date
            title
        }
    }`;

export const CONTENT_QUERY = gql`
    query GetContent ($_id: string) {
        notice (where: {_id: {_eq: $_id}}) {
            _id
            date
            title
            content
        }
    }`;

export const SERVER_QUERY = gql`
    query GetServerInfo {
        serverInfo {
            _id
            globalIp
            localIp
            port
            proxy
        }
    }`;

export const REQUEST_QUERY = gql`
    query GetRequests($user_id: string) {
        request (limit: 20000, where: {user_id: {_eq: $user_id}}) {
            _id
            user_id
            action
            state
            book_id
        }
    }`;


