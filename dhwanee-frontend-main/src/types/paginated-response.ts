export default interface PaginatedResponse<T> {
    count: number;
    results: T[];
    next: null | string;
    previous: null | string;
}