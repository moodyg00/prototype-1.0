import type { ToolViewRegistration } from '@/lib/tool-views';
import { PhotosDrawerView } from './PhotosDrawerView';
import { PhotosGridView } from './PhotosGridView';
import { PhotosListView } from './PhotosListView';

export const photosToolViews: ToolViewRegistration = {
  docked: PhotosListView,
  container: PhotosListView,
  floating: PhotosGridView,
  drawer: PhotosDrawerView,
};