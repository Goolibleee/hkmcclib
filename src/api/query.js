import gql from "graphql-tag";

export const BOOK_QUERY = gql`
    query AllBook{
        books (sortBy: TITLE_ASC, limit:20000) {
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
        }
    }
`;

export const RENT_QUERY = gql`
    query AllRent{
        rents (limit:20000) {
            _id
            book_id
            user_id
            rent_date
            return_date
            state
        }
    }
`;

export const USERS_QUERY = gql`
    query AllUser {
        users (limit: 20000) {
            _id
            name
            state
            level
        }
    }`;

export const USER_QUERY = gql`
    query FindUser($_id: String!){
        user (query: {_id:$_id}) {
            _id
            name
            state
            level
            encrypted_email
            encrypted_phone
        }
    }`;

export const HISTORY_QUERY = gql`
    query findLogs($user_id: String!){
        rentLogs (query: {user_id: $user_id}) {
            _id
            book_id
            book_state
            timestamp
            user_id
        }
    }`;

export const NOTICE_QUERY = gql`
    query GetNotices {
        notices (sortBy: _ID_DESC, limit:20000) {
            _id
            date
            title
        }
    }`;

export const CONTENT_QUERY = gql`
    query GetContent ($_id: String!) {
        notice (query: {_id: $_id}) {
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
        }
    }`;
