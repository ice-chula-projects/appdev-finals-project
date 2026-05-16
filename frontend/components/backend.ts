import { File } from "expo-file-system";

export default class BackEnd {
    static #apiUrl: string = null

    static async setApiUrl(apiUrl: string): Promise<SetApiUrlResponse> {
        const response = new SetApiUrlResponse();

        try {
            apiUrl = apiUrl.trim();
            if (apiUrl.at(-1) != "/") apiUrl += "/";

            //test the api
            const apiResponse = await fetch(apiUrl);
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

    static async login(username: string, password: string): Promise<LoginResponse> {
        if (this.#apiUrl == null) {
            const response = new LoginResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new LoginResponse();

        try {
            const apiResponse = await fetch(this.#apiUrl + "login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    password: password
                })
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {

                response.success = true;
                response.message = body.message;
                response.sessionToken = body.session_token;
                response.userUuid = body.user_uuid;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async logout(sessionToken: string): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();

        try {
            const apiResponse = await fetch(this.#apiUrl + "logout", {
                method: "POST",
                headers: {
                    "session-token": sessionToken
                }
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async createUser(username: string, password: string): Promise<LoginResponse> {
        if (this.#apiUrl == null) {
            const response = new LoginResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new LoginResponse();

        try {
            const apiResponse = await fetch(this.#apiUrl + "create_user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username,
                    password: password
                })
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {

                response.success = true;
                response.message = body.message;
                response.sessionToken = body.session_token;
                response.userUuid = body.user_uuid;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async getUserProfile(userUuid: string): Promise<GetUserProfileResponse> {
        if (this.#apiUrl == null) {
            const response = new GetUserProfileResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response
        }

        const response = new GetUserProfileResponse();
        const params = new URLSearchParams();

        params.append("uuid", userUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "get_user_profile?" + params.toString(), {
                method: "GET"
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

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
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async getUsers(userUuids: string[]): Promise<GetUsersResponse> {
        if (this.#apiUrl == null) {
            const response = new GetUsersResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response
        }

        const response = new GetUsersResponse();
        const params = new URLSearchParams();

        for (const userUuid of userUuids) {
            params.append("uuid", userUuid);
        }

        try {
            const apiResponse = await fetch(this.#apiUrl + "get_users?" + params.toString(), {
                method: "GET"
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

                const users = {}

                for (const uuid of Object.keys(body.users)) {
                    const user = body.users[uuid];

                    users[uuid] = {
                        uuid: user.uuid,
                        name: user.name,
                        profilePictureUri: "data:image/png;base64," + user.profile_picture_base64
                    } as DisplayUser
                }

                response.users = users;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async updateUser(sessionToken: string, userUpdateParameters: UserUpdateParameters): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();

        try {
            const apiResponse = await fetch(this.#apiUrl + "update_user", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify({
                    name: userUpdateParameters.name,
                    motd: userUpdateParameters.motd,
                    profile_picture_base64: await BackEnd.imageUriToBase64(userUpdateParameters.profilePictureUri),
                    password: userUpdateParameters.password
                })
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async deleteUser(sessionToken: string): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();

        try {
            const apiResponse = await fetch(this.#apiUrl + "delete_user", {
                method: "DELETE",
                headers: {
                    "session-token": sessionToken
                }
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async createThread(sessionToken: string, threadParameters: ThreadParameters): Promise<CreateThreadResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response as CreateThreadResponse;
        }

        const response = new CreateThreadResponse();

        try {
            const apiResponse = await fetch(this.#apiUrl + "create_thread", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify({
                    name: threadParameters.name,
                    description: threadParameters.description,
                    thumbnail_base64: await BackEnd.imageUriToBase64(threadParameters.thumbnailImageUri),
                    password: threadParameters.password
                })
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

                response.threadUuid = body.thread_uuid;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async searchThreads(page?: number, searchString?: string): Promise<SearchThreadsResponse> {
        if (this.#apiUrl == null) {
            const response = new SearchThreadsResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new SearchThreadsResponse();
        const params = new URLSearchParams();

        if (page != null) params.append("page", page.toFixed(0));
        if (searchString != null) params.append("search", searchString);
        try {
            const apiResponse = await fetch(this.#apiUrl + "search_threads?" + params.toString(), {
                method: "GET"
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

                const threads = []
                for (const thread of body.threads) {
                    threads.push({
                        uuid: thread.uuid,
                        name: thread.name,
                        description: thread.description,
                        thumbnailUri: "data:image/png;base64," + thread.thumbnail_base64,
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
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async getThread(threadUuid: string): Promise<GetThreadResponse> {
        if (this.#apiUrl == null) {
            const response = new GetThreadResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new GetThreadResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "get_thread?" + params.toString(), {
                method: "GET"
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

                const thread: DisplayThread = {
                    uuid: body.thread.uuid,
                    name: body.thread.name,
                    description: body.thread.description,
                    thumbnailUri: "data:image/png;base64," + body.thread.thumbnail_base64,
                    authorUserUuid: body.thread.author_user_uuid,
                    creationDate: new Date(body.thread.creation_date),
                    lastModifiedDate: new Date(body.thread.last_modified_date),
                    lastMessageDate: new Date(body.thread.last_message_date),
                    private: Boolean(body.thread.private)
                }

                response.thread = thread;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async getThreads(threadUuids: string[]): Promise<GetThreadsResponse> {
    if (this.#apiUrl == null) {
        const response = new GetThreadsResponse();

        response.success = false;
        response.message = "Invalid Api Url";
        return response;
    }

    const response = new GetThreadsResponse();
    const params = new URLSearchParams();

    for (const threadUuid of threadUuids) {
        params.append("uuid", threadUuid);
    }

    try {
        const apiResponse = await fetch(
            this.#apiUrl + "get_threads?" + params.toString(),
            {
                method: "GET"
            }
        );

        const body = await apiResponse.json();

        if (apiResponse.ok) {
            response.success = true;
            response.message = body.message;

            const threads: Record<string, DisplayThread> = {};

            for (const uuid of Object.keys(body.threads)) {
                const thread = body.threads[uuid];

                threads[uuid] = {
                    uuid: thread.uuid,
                    name: thread.name,
                    description: thread.description,
                    thumbnailUri: "data:image/png;base64," + thread.thumbnail_base64,
                    authorUserUuid: thread.author_user_uuid,

                    creationDate: new Date(thread.creation_date),
                    lastModifiedDate: new Date(thread.last_modified_date),
                    lastMessageDate: new Date(thread.last_message_date),

                    private: thread.private === true
                };
            }

            response.threads = threads;
        } else {
            response.success = false;
            response.message = body.error;
        }
    } catch (error) {
        response.success = false;
        response.message = String(error);
    }

    return response;
}

    static async updateThread(sessionToken: string, threadUuid: string, threadUpdateParameters: ThreadUpdateParameters): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "update_thread?" + params.toString(), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify({
                    name: threadUpdateParameters.name,
                    description: threadUpdateParameters.description,
                    thumbnail_base64: await BackEnd.imageUriToBase64(threadUpdateParameters.thumbnailImageUri),
                    password: threadUpdateParameters.password,
                    remove_thumbnail: threadUpdateParameters.removeThumbnail
                })
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async deleteThread(sessionToken: string, threadUuid: string): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "delete_thread?" + params.toString(), {
                method: "DELETE",
                headers: {
                    "session-token": sessionToken
                }
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async createMessage(sessionToken: string, threadUuid: string, messageParameters: MessageParameters, threadPassword?: string): Promise<CreateMessageResponse> {
        if (this.#apiUrl == null) {
            const response = new CreateMessageResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new CreateMessageResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const headers = {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                }
            if (threadPassword != null) headers["thread-password"] = threadPassword;

            const requestBody = {
                message: messageParameters.message
            }

            if (messageParameters.attachment != null){
                requestBody["attachment"] = {
                    data_base64: messageParameters.attachment.dataBase64,
                    extenstion_type: messageParameters.attachment.extensionType,
                    mdia_type: messageParameters.attachment.mediaType
                }
            }
            const apiResponse = await fetch(this.#apiUrl + "create_message?" + params.toString(), {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody)
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

                response.messageUuid = body.message_uuid;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async getThreadMessages(sessionToken: string, threadUuid: string, page?: number, threadPassword?: string): Promise<GetThreadMessagesResponse>{
        if (this.#apiUrl == null) {
            const response = new GetThreadMessagesResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response
        }

        const response = new GetThreadMessagesResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        if (page != null) params.append("page", page.toFixed(0));

        try {
            const headers = {
                    "session-token": sessionToken
                }
            if (threadPassword != null) headers["thread-password"] = threadPassword;

            const apiResponse = await fetch(this.#apiUrl + "get_thread_messages?" + params.toString(), {
                method: "GET",
                headers: headers
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;

                const messages = []

                for (const message of body.messages){
                    messages.push({
                        uuid: message.uuid,
                        authorUserUuid: message.author_user_uuid,
                        message: message.message,
                        attachment: new Attachment(message.attachment.data_base64, message.attachment.extension_type, message.attachment.media_type),

                        creationDate: new Date(message.creation_date),
                        lastModifiedDate: new Date(message.last_modified_date)
                    } as Message)
                }

                response.messages = messages;
                response.totalMessages = body.total_messages;
                response.page = body.page;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async updateMessage(sessionToken: string, threadUuid: string, messageUuid: string, messageUpdateParameters: MessageUpdateParameters): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const requestBody = {
                message_uuid: messageUuid,
                message: messageUpdateParameters.message,
                remove_message: messageUpdateParameters.removeMessage,
                remove_attachment: messageUpdateParameters.removeAttachment
            }

            if (messageUpdateParameters.attachment != null){
                requestBody["attachment"] = {
                    data_base64: messageUpdateParameters.attachment.dataBase64,
                    extenstion_type: messageUpdateParameters.attachment.extensionType,
                    mdia_type: messageUpdateParameters.attachment.mediaType
                }
            }

            const apiResponse = await fetch(this.#apiUrl + "update_message?" + params.toString(), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify(requestBody)
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async deleteMessage(sessionToken: string, threadUuid: string, messageUuid: string): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "delete_message?" + params.toString(), {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "session-token": sessionToken
                },
                body: JSON.stringify({
                    message_uuid: messageUuid,
                })
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async saveThread(sessionToken: string, threadUuid: string): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "save_thread?" + params.toString(), {
                method: "POST",
                headers: {
                    "session-token": sessionToken
                }
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async unsaveThread(sessionToken: string, threadUuid: string): Promise<ApiResponse> {
        if (this.#apiUrl == null) {
            const response = new ApiResponse();

            response.success = false;
            response.message = "Invalid Api Url";
            return response;
        }

        const response = new ApiResponse();
        const params = new URLSearchParams();

        params.append("uuid", threadUuid)
        try {
            const apiResponse = await fetch(this.#apiUrl + "unsave_thread?" + params.toString(), {
                method: "POST",
                headers: {
                    "session-token": sessionToken
                }
            })
            const body = await apiResponse.json();

            if (apiResponse.ok) {
                response.success = true;
                response.message = body.message;
            }
            else {
                response.success = false;
                response.message = body.error;
            }
        } catch (error) {
            response.success = false;
            response.message = String(error)
        }

        return response;
    }

    static async imageUriToBase64(imageUri: string): Promise<string> {
        const file = new File(imageUri)

        return await file.base64()
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
    thumbnailUri: string;
    authorUserUuid: string;

    creationDate: Date;
    lastModifiedDate: Date;
    lastMessageDate: Date;

    private: boolean;
}

export interface Message {
    uuid: string;
    authorUserUuid: string;
    message: string;
    attachment: Attachment;

    creationDate: Date;
    lastModifiedDate: Date;
}

export type MediaType = "image" | "audio" | "video" | "text" | "application";

export class Attachment {
    dataBase64: string
    extensionType: string
    mediaType: MediaType

    static async fromAttachmentUri(attachmentUri: string, mediaType: MediaType): Promise<Attachment>{
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
    name: string;
    description: string;
    thumbnailImageUri: string;
    password: string;
}

export class ThreadParametersBuilder implements ThreadParameters{
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
    removeThumbnail: boolean;
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

export interface UserUpdateParameters{
    name: string;
    motd: string;
    profilePictureUri: string;
    password: string;
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
    message: string;
    attachment: Attachment;
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
    removeMessage: boolean;
    removeAttachment: boolean;
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