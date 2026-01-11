/**
 * Tag resource
 */
export interface Tag {
  id: string;
  brandId: string;
  name: string;
  color: string;
  createdAt: string;
}

/**
 * Input for creating a tag
 */
export interface CreateTagInput {
  name: string;
  color?: string;
}

/**
 * Input for updating a tag
 */
export interface UpdateTagInput {
  name?: string;
  color?: string;
}

/**
 * Input for merging tags
 */
export interface MergeTagsInput {
  sourceTagIds: string[];
}
