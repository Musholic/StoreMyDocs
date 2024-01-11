import {ResolveFn} from '@angular/router';
import {inject} from "@angular/core";
import {map, Observable, zip} from "rxjs";
import {FileService} from "../file-list/file.service";
import {FileOrFolderElement} from "../file-list/file-list.component";

export interface FilesCache {
  baseFolder: string,
  all: FileOrFolderElement[]
}

export const filesResolver: ResolveFn<Observable<FilesCache>> = (route, state) => {
  let fileService = inject(FileService);
  return zip(
    fileService.findOrCreateBaseFolder(),
    fileService.findAll()
  ).pipe(map(([baseFolderId, allFiles]) => {
    return {
      baseFolder: baseFolderId,
      all: allFiles
    }
  }))
};
