/**
 * The envelope every `app/api` route returns.
 *
 * A single shape means the Axios layer can unwrap responses generically, and
 * the future mobile client gets the same contract for free.
 */
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    code: string;
    /** Field-level messages from Zod, keyed by field path. */
    details?: Record<string, string[]>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** A page of results plus everything the pager needs to render itself. */
export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
