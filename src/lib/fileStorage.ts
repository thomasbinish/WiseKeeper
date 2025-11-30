import { set, get, del, keys } from 'idb-keyval';
import { Attachment } from '@/types';

const STORE_PREFIX = 'attachment_';

export const fileStorage = {
    async saveFile(file: File): Promise<string> {
        const id = Math.random().toString(36).substr(2, 9);
        const attachmentId = `${STORE_PREFIX}${id}`;

        // Store the file blob directly
        await set(attachmentId, file);
        return id;
    },

    async getFile(id: string): Promise<File | undefined> {
        return await get(`${STORE_PREFIX}${id}`);
    },

    async deleteFile(id: string): Promise<void> {
        await del(`${STORE_PREFIX}${id}`);
    },

    async getAllAttachmentIds(): Promise<string[]> {
        const allKeys = await keys();
        return allKeys
            .filter(k => typeof k === 'string' && k.startsWith(STORE_PREFIX))
            .map(k => (k as string).replace(STORE_PREFIX, ''));
    }
};
