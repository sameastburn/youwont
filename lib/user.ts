type HasName = { first_name: string; last_name: string };

export function fullName(user: HasName): string {
    if (!user.last_name) return user.first_name;
    return `${user.first_name} ${user.last_name}`;
}

export function getInitials(user: HasName): string {
    const first = user.first_name?.[0] ?? '';
    const last = user.last_name?.[0] ?? '';
    return (first + last).toUpperCase() || '?';
}
