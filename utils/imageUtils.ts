import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP, PLACEHOLDER_STILL, PLACEHOLDER_PROFILE } from '../constants';

export const getImageUrl = (
    path: string | null | undefined, 
    size: string = 'w342',
    type: 'poster' | 'backdrop' | 'still' | 'profile' = 'poster'
) => {
    const placeholder = type === 'poster' ? PLACEHOLDER_POSTER : 
                        type === 'backdrop' ? PLACEHOLDER_BACKDROP : 
                        type === 'still' ? PLACEHOLDER_STILL :
                        PLACEHOLDER_PROFILE;
    if (!path) {
        return placeholder;
    }
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};