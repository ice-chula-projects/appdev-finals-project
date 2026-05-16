import { File } from "expo-file-system";

export default class BackEnd {
    static #apiUrl: string = null

    static async setApiUrl(apiUrl: string): Promise<SetApiUrlResponse> {
        const response = new SetApiUrlResponse();

        try {
            apiUrl = apiUrl.trim();
            if (apiUrl.at(-1) != "/") apiUrl += "/";

            //test the api
            const apiResponse = await fetch(apiUrl + "get_board_info");
            let valid = false;

            if (apiResponse.ok) {
                const body = await apiResponse.json();
                if (body.is_appdev_finals_message_board != null) valid = true;
            }

            if (valid) {
                this.#apiUrl = apiUrl;
                response.message = "Success";
                response.success = true;
                return response;
            }

            response.message = "Invalid Api Url";
            response.success = false;
        } catch (error) {
            response.success = false;
            response.message = String(error);
        }

        return response;
    }

    private static async sendApiRequest<T extends BaseApiResponse>(emptyResponse: T, endpoint: string, fetchApiRequestInit: RequestInit, onSuccess?: (apiResponseBody: any, emptyResponse: T) => T | Promise<T>, params?: URLSearchParams): Promise<T> {
        if (this.#apiUrl == null) {
            emptyResponse.success = false;
            emptyResponse.message = "Invalid Api Url.";
            return emptyResponse
        }

        let url = this.#apiUrl + endpoint
        if (params != null) url += `?${params.toString()}`;

        try {
            const apiResponse = await fetch(url, fetchApiRequestInit);
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                emptyResponse.success = true;
                emptyResponse.message = body.message;
                if (onSuccess != null) emptyResponse = await onSuccess(body, emptyResponse);
            }
            else {
                emptyResponse.success = false;
                emptyResponse.message = body.error;
            }
        } catch (error) {
            emptyResponse.success = false;
            emptyResponse.message = String(error)
        }

        return emptyResponse;
    }


    private static async imageUriToBase64(imageUri: string): Promise<string> {
        const file = new File(imageUri)

        return await file.base64()
    }

    static async getBoardInfo(): Promise<GetBoardInfoResponse> {
        return await this.sendApiRequest(
            new GetBoardInfoResponse(),
            "get_board_info",
            {
                method: "GET"
            },
            (body, response) => {
                response.name = body.name;

                return response
            }
        )
    }

    static async login(username: string, password: string): Promise<LoginResponse> {
        return await this.sendApiRequest<LoginResponse>(
            new LoginResponse(),
            "login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    password: password
                })
            },
            (body, response) => {
                response.sessionToken = body.session_token;
                response.userUuid = body.user_uuid;
                return response
            }
        )
    }

    static async logout(sessionToken: string): Promise<ApiResponse> {
        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "logout",
            {
                method: "POST",
                headers: {
                    "session-token": sessionToken
                }
            }
        )
    }

    static async createUser(username: string, password: string): Promise<LoginResponse> {
        return await this.sendApiRequest<LoginResponse>(
            new LoginResponse(),
            "create_user",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    password: password
                }),
            },
            (body, response) => {
                response.sessionToken = body.session_token;
                response.userUuid = body.user_uuid;
                return response
            }
        )
    }

    static async getUserProfile(userUuid: string): Promise<GetUserProfileResponse> {
        const params = new URLSearchParams();

        params.append("uuid", userUuid)
        return await this.sendApiRequest<GetUserProfileResponse>(
            new GetUserProfileResponse(),
            "get_user_profile",
            {
                method: "GET"
            },
            (body, response) => {
                const user = body.user;
                const userProfile: UserProfile = {
                    uuid: user.uuid,
                    name: user.name,
                    motd: user.motd,
                    profilePictureUri: "data:image/png;base64," + user.profile_picture_base64,
                    savedThreads: user.saved_threads,
                    threadHistory: user.thread_history
                }

                response.userProfile = userProfile;
                return response;
            },
            params
        )
    }

    static async getUsers(userUuids: string[]): Promise<GetUsersResponse> {
        const params = new URLSearchParams();

        for (const userUuid of userUuids) {
            params.append("uuid", userUuid);
        }

        return await this.sendApiRequest<GetUsersResponse>(
            new GetUsersResponse(),
            "get_users",
            {
                method: "GET"
            },
            (body, response) => {
                const users: Record<string, DisplayUser> = {}

                for (const uuid of Object.keys(body.users)) {
                    const user = body.users[uuid];

                    users[uuid] = {
                        uuid: user.uuid,
                        name: user.name,
                        profilePictureUri: "data:image/png;base64," + user.profile_picture_base64
                    }
                }

                response.users = users;
                return response;
            },
            params
        )
    }

    static async updateUser(sessionToken: string, userUpdateParameters: UserUpdateParameters): Promise<ApiResponse> {
        const body = {
            name: userUpdateParameters.name,
            motd: userUpdateParameters.motd,
            password: userUpdateParameters.password,
            profile_picture_base64: null
        }

        if (userUpdateParameters.profilePictureUri != null) {
            body.profile_picture_base64 = await BackEnd.imageUriToBase64(userUpdateParameters.profilePictureUri);
        }

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "update_user",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify(body)
            }
        )
    }

    static async deleteUser(sessionToken: string): Promise<ApiResponse> {
        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "delete_user",
            {
                method: "DELETE",
                headers: {
                    "session-token": sessionToken
                }
            }
        )
    }

    static async createThread(sessionToken: string, threadParameters: ThreadParameters): Promise<CreateThreadResponse> {
        const body = {
            name: threadParameters.name,
            description: threadParameters.description,
            thumbnail_base64: null,
            password: threadParameters.password
        }

        if(threadParameters.thumbnailImageUri != null){
            body.thumbnail_base64 = await BackEnd.imageUriToBase64(threadParameters.thumbnailImageUri)
        }

        return await this.sendApiRequest<CreateThreadResponse>(
            new CreateThreadResponse(),
            "create_thread",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify(body)
            },
            (body, response) => {
                response.threadUuid = body.thread_uuid;
                return response;
            }
        )
    }

    static async searchThreads(page?: number, searchString?: string): Promise<SearchThreadsResponse> {
        const params = new URLSearchParams();

        if (page != null) params.append("page", page.toFixed(0));
        if (searchString != null) params.append("search", searchString);

        return await this.sendApiRequest<SearchThreadsResponse>(
            new SearchThreadsResponse(),
            "search_threads",
            {
                method: "GET"
            },
            (body, response) => {
                const threads = []
                for (const thread of body.threads) {
                    let thumbnailUri = null;
                    if (thread.thumbnail_base64 != null){
                        thumbnailUri = "data:image/png;base64," + thread.thumbnail_base64;
                    }

                    threads.push({
                        uuid: thread.uuid,
                        name: thread.name,
                        description: thread.description,
                        thumbnailUri: thumbnailUri,
                        authorUserUuid: thread.author_user_uuid,
                        creationDate: new Date(thread.creation_date),
                        lastModifiedDate: new Date(thread.last_modified_date),
                        lastMessageDate: new Date(thread.last_message_date),
                        private: thread.private === true
                    } as DisplayThread)
                }

                response.threads = threads;
                response.totalThreads = body.total_threads;
                response.page = body.page;

                return response
            },
            params
        )
    }

    static async getThread(threadUuid: string): Promise<GetThreadResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)

        return await this.sendApiRequest<GetThreadResponse>(
            new GetThreadResponse(),
            "get_thread",
            {
                method: "GET"
            },
            (body, response) => {
                let thumbnailUri = null;
                    if (body.thread.thumbnail_base64 != null){
                        thumbnailUri = "data:image/png;base64," + body.thread.thumbnail_base64;
                }

                const thread: DisplayThread = {
                    uuid: body.thread.uuid,
                    name: body.thread.name,
                    description: body.thread.description,
                    thumbnailUri: thumbnailUri,
                    authorUserUuid: body.thread.author_user_uuid,
                    creationDate: new Date(body.thread.creation_date),
                    lastModifiedDate: new Date(body.thread.last_modified_date),
                    lastMessageDate: new Date(body.thread.last_message_date),
                    private: Boolean(body.thread.private)
                }

                response.thread = thread;
                return response
            },
            params
        )
    }

    static async getThreads(threadUuids: string[]): Promise<GetThreadsResponse> {
        const params = new URLSearchParams();

        for (const threadUuid of threadUuids) {
            params.append("uuid", threadUuid);
        }

        return await this.sendApiRequest<GetThreadsResponse>(
            new GetThreadsResponse(),
            "get_threads",
            {
                method: "GET"
            },
            (body, response) => {
                const threads: Record<string, DisplayThread> = {};

                for (const uuid of Object.keys(body.threads)) {
                    const thread = body.threads[uuid];

                    let thumbnailUri = null;
                    if (thread.thumbnail_base64 != null){
                        thumbnailUri = "data:image/png;base64," + thread.thumbnail_base64;
                    }

                    threads[uuid] = {
                        uuid: thread.uuid,
                        name: thread.name,
                        description: thread.description,
                        thumbnailUri: thumbnailUri,
                        authorUserUuid: thread.author_user_uuid,

                        creationDate: new Date(thread.creation_date),
                        lastModifiedDate: new Date(thread.last_modified_date),
                        lastMessageDate: new Date(thread.last_message_date),

                        private: thread.private === true
                    };
                }

                response.threads = threads;
                return response
            },
            params
        )
    }

    static async updateThread(sessionToken: string, threadUuid: string, threadUpdateParameters: ThreadUpdateParameters): Promise<ApiResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid);

        const body = {
            name: threadUpdateParameters.name,
            description: threadUpdateParameters.description,
            thumbnail_base64: null,
            password: threadUpdateParameters.password,
            remove_thumbnail: threadUpdateParameters.removeThumbnail
        }

        if (threadUpdateParameters.thumbnailImageUri != null) {
            body.thumbnail_base64 = await BackEnd.imageUriToBase64(threadUpdateParameters.thumbnailImageUri)
        }

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "update_thread",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify(body)
            },
            null,
            params
        )
    }

    static async deleteThread(sessionToken: string, threadUuid: string): Promise<ApiResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "delete_thread",
            {
                method: "DELETE",
                headers: {
                    "session-token": sessionToken
                }
            },
            null,
            params
        )
    }

    static async createMessage(sessionToken: string, threadUuid: string, messageParameters: MessageParameters, threadPassword?: string): Promise<CreateMessageResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)

        const headers = {
            "Content-Type": "application/json",
            "session-token": sessionToken
        }
        if (threadPassword != null) headers["thread-password"] = threadPassword;

        const body = {
            message: messageParameters.message
        }

        if (messageParameters.attachment != null) {
            body["attachment"] = {
                data_base64: messageParameters.attachment.dataBase64,
                extension_type: messageParameters.attachment.extensionType,
                media_type: messageParameters.attachment.mediaType
            }
        }

        return await this.sendApiRequest<CreateMessageResponse>(
            new CreateMessageResponse(),
            "create_message",
            {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            },
            (body, response) => {
                response.messageUuid = body.message_uuid;
                return response;
            },
            params
        )
    }

    static async getThreadMessages(sessionToken: string, threadUuid: string, page?: number, threadPassword?: string): Promise<GetThreadMessagesResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        if (page != null) params.append("page", page.toFixed(0));

        const headers = {
            "session-token": sessionToken
        }
        if (threadPassword != null) headers["thread-password"] = threadPassword;

        return await this.sendApiRequest<GetThreadMessagesResponse>(
            new GetThreadMessagesResponse(),
            "get_thread_messages",
            {
                method: "GET",
                headers: headers
            },
            (body, response) => {
                const messages = []

                for (const message of body.messages) {
                    let attachment = null;
                    if (message.attachment != null) {
                        attachment = new Attachment(message.attachment.data_base64, message.attachment.extension_type, message.attachment.media_type);
                    }

                    messages.push({
                        uuid: message.uuid,
                        authorUserUuid: message.author_user_uuid,
                        message: message.message,
                        attachment: attachment,

                        creationDate: new Date(message.creation_date),
                        lastModifiedDate: new Date(message.last_modified_date)
                    } as Message)
                }

                response.messages = messages;
                response.totalMessages = body.total_messages;
                response.page = body.page;
                return response;
            },
            params
        )
    }

    static async updateMessage(sessionToken: string, threadUuid: string, messageUuid: string, messageUpdateParameters: MessageUpdateParameters): Promise<ApiResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid);

        const body = {
            message_uuid: messageUuid,
            message: messageUpdateParameters.message,
            remove_message: messageUpdateParameters.removeMessage,
            remove_attachment: messageUpdateParameters.removeAttachment
        }

        if (messageUpdateParameters.attachment != null) {
            body["attachment"] = {
                data_base64: messageUpdateParameters.attachment.dataBase64,
                extension_type: messageUpdateParameters.attachment.extensionType,
                media_type: messageUpdateParameters.attachment.mediaType
            }
        }

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "update_message",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify(body)
            },
            null,
            params
        )
    }

    static async deleteMessage(sessionToken: string, threadUuid: string, messageUuid: string): Promise<ApiResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "delete_message",
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify({
                    message_uuid: messageUuid,
                })
            },
            null,
            params
        )
    }

    static async saveThread(sessionToken: string, threadUuid: string): Promise<ApiResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "save_thread",
            {
                method: "POST",
                headers: {
                    "session-token": sessionToken
                }
            },
            null,
            params
        )
    }

    static async unsaveThread(sessionToken: string, threadUuid: string): Promise<ApiResponse> {
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)

        return await this.sendApiRequest<ApiResponse>(
            new ApiResponse(),
            "unsave_thread",
            {
                method: "POST",
                headers: {
                    "session-token": sessionToken
                }
            },
            null,
            params
        )
    }
}

export interface UserProfile {
    uuid: string;
    name: string;
    motd: string;
    profilePictureUri: string;
    savedThreads: string[];
    threadHistory: string[];
}

export interface DisplayUser {
    uuid: string;
    name: string;
    profilePictureUri: string;
}

export interface DisplayThread {
    uuid: string;
    name: string;
    description: string;
    thumbnailUri?: string;
    authorUserUuid: string;

    creationDate: Date;
    lastModifiedDate: Date;
    lastMessageDate: Date;

    private: boolean;
}

export interface Message {
    uuid: string;
    authorUserUuid: string;
    message?: string;
    attachment?: Attachment;

    creationDate: Date;
    lastModifiedDate: Date;
}

export type MediaType = "image" | "audio" | "video" | "text" | "application";

export class Attachment {
    dataBase64: string
    extensionType: string
    mediaType: MediaType

    static async fromAttachmentUri(attachmentUri: string, mediaType: MediaType): Promise<Attachment> {
        const file = new File(attachmentUri);

        return new Attachment(await file.base64(), file.extension, mediaType)
    }

    constructor(dataBase64: string, extenstionType: string, mediaType: MediaType) {
        this.dataBase64 = dataBase64;
        this.extensionType = extenstionType;
        this.mediaType = mediaType;
    }
}

export interface ThreadParameters {
    name?: string;
    description?: string;
    thumbnailImageUri?: string;
    password?: string;
}

export class ThreadParametersBuilder implements ThreadParameters {
    name: string = null;
    description: string = null;
    thumbnailImageUri: string = null;
    password: string = null;

    setName(name: string) {
        this.name = name;
        return this;
    }

    setDescription(description: string) {
        this.description = description;
        return this;
    }

    setThumbnailImageUri(thumbnailImageUri: string) {
        this.thumbnailImageUri = thumbnailImageUri;
        return this;
    }

    setPassword(password: string) {
        this.password = password;
        return this;
    }
}

export interface ThreadUpdateParameters extends ThreadParameters {
    removeThumbnail?: boolean;
}

export class ThreadUpdateParametersBuilder extends ThreadParametersBuilder implements ThreadUpdateParameters {
    removeThumbnail: boolean = false;

    constructor() {
        super();
    }

    setRemoveThumbnail(removeThumbnail: boolean) {
        this.removeThumbnail = removeThumbnail;
        return this;
    }
}

export interface UserUpdateParameters {
    name?: string;
    motd?: string;
    profilePictureUri?: string;
    password?: string;
}

export class UserUpdateParametersBuilder implements UserUpdateParameters {
    name: string = null;
    motd: string = null;
    profilePictureUri: string = null;
    password: string = null;

    setName(name: string) {
        this.name = name;
        return this;
    }

    setMotd(motd: string) {
        this.motd = motd;
        return this;
    }

    setProfilePictureUri(profilePictureUri: string) {
        this.profilePictureUri = profilePictureUri;
        return this;
    }

    setPassword(password: string) {
        this.password = password;
        return this;
    }
}

export interface MessageParameters {
    message?: string;
    attachment?: Attachment;
}

export class MessageParametersBuilder implements MessageParameters {
    message: string = null;
    attachment: Attachment = null;

    setMessage(message: string) {
        this.message = message;
        return this;
    }

    setAttachment(attachment: Attachment) {
        this.attachment = attachment;
        return this;
    }
}


export interface MessageUpdateParameters extends MessageParameters {
    removeMessage?: boolean;
    removeAttachment?: boolean;
}

export class MessageUpdateParametersBuilder extends MessageParametersBuilder implements MessageUpdateParameters {
    removeMessage: boolean = false;
    removeAttachment: boolean = false;

    constructor() {
        super();
    }

    setRemoveMessage(removeMessage: boolean) {
        this.removeMessage = removeMessage;
        return this;
    }

    setRemoveAttachment(removeAttachment: boolean) {
        this.removeAttachment = removeAttachment;
        return this;
    }
}

export interface BaseApiResponse {
    success: boolean;
    message: string;
}

export class ApiResponse implements BaseApiResponse {
    success: boolean;
    message: string;
}

export class SetApiUrlResponse implements BaseApiResponse {
    success: boolean;
    message: string;
}

export class LoginResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    userUuid: string;
    sessionToken: string;
}

export class CreateThreadResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    threadUuid: string;
}

export class CreateMessageResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    messageUuid: string;
}

export class GetUserProfileResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    userProfile: UserProfile
}

export class GetUsersResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    users: Record<string, DisplayUser>;
}

export class SearchThreadsResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    threads: DisplayThread[];
    totalThreads: number;
    page: number;
}

export class GetThreadResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    thread: DisplayThread;
}

export class GetThreadMessagesResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    messages: Message[];
    totalMessages: number;
    page: number;
}

export class GetThreadsResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    threads: Record<string, DisplayThread>;
}

export class GetBoardInfoResponse implements BaseApiResponse {
    success: boolean;
    message: string;

    name: string
}