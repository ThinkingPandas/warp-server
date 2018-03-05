// @flow
/**
 * References
 */
import WarpServer from '../index';
import User from '../classes/user';

export type FindOptionsType = {
    api: WarpServer,
    select: Array<string>,
    include: Array<string>,
    where: {[name: string]: {[name: string]: any}},
    sort: Array<string | {[name: string]: any}>,
    skip: number,
    limit: number
}

export type FirstOptionsType = {
    api: WarpServer,
    id: number,
    select: Array<string>,
    include: Array<string>
};

export type CreateOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    keys: {[name: string]: any}
};

export type UpdateOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    id: number,
    keys: {[name: string]: any}
};

export type DestroyOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    id: number
};

export type LoginOptionsType = {
    api: WarpServer,
    metadata: {[name: string]: any},
    currentUser: User.Class,
    username: string,
    email: string,
    password: string
};

export type MeOptionsType = {
    currentUser: User.Class
};

export type LogoutOptionsType = {
    api: WarpServer,
    sessionToken: string
};