import { Injectable, inject } from '@angular/core';
import type { Timestamp } from 'firebase/firestore';
import { deleteObject, getBlob, ref, uploadString } from 'firebase/storage';
import { epochOf } from '../models';
import { FIREBASE_STORAGE } from './firebase.providers';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly storage = inject(FIREBASE_STORAGE);

  async upload(
    listId: string,
    listCreatedAt: Timestamp,
    itemId: string,
    dataUrl: string,
  ): Promise<string> {
    const path = `lists/${listId}/${epochOf(listCreatedAt)}/${itemId}/photo.jpg`;
    await uploadString(ref(this.storage, path), dataUrl, 'data_url');
    return path;
  }

  // Storage rules are not evaluated on a getDownloadURL token URL, so the bytes
  // are fetched through the SDK and handed to the page as a blob URL.
  async objectUrl(photoPath: string): Promise<string> {
    const blob = await getBlob(ref(this.storage, photoPath));
    return URL.createObjectURL(blob);
  }

  remove(photoPath: string): Promise<void> {
    return deleteObject(ref(this.storage, photoPath));
  }
}
