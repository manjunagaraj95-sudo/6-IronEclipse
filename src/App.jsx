
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';

// --- Icons (Simulated using Unicode characters or simple text for brevity) ---
const Icons = {
    Dashboard: '📊',
    Orders: '📦',
    Partners: '🤝',
    Rates: '💰',
    Customers: '👤',
    Analytics: '📈',
    Settings: '⚙️',
    Logout: '🚪',
    Search: '🔍',
    Notification: '🔔',
    User: '🧑‍💻',
    Sun: '☀️',
    Moon: '🌙',
    ChevronRight: '❯',
    ChevronLeft: '❮',
    Add: '➕',
    Edit: '✏️',
    Delete: '🗑️',
    Check: '✔️',
    Clock: '⏰',
    Warning: '⚠️',
    Error: '❌',
    Info: 'ℹ️',
    Success: '✅',
    Calendar: '📅',
    Filter: 'F',
    Sort: 'S',
    Truck: '🚚',
    Bag: '🛍️',
    Upload: '⬆️',
    File: '📄',
    Accept: '👍',
    Deliver: '✅',
    Pickup: '✅',
    Iron: '👕',
    Ready: '✨',
    Dollar: '$',
    Gauge: '🎯',
    TrendUp: '▲',
    TrendDown: '▼',
    Menu: '☰',
    Close: '✖️',
};

// --- RBAC & Auth Context ---
const AuthContext = createContext(null);

const ROLES = {
    ADMIN: 'Admin',
    CUSTOMER: 'Customer',
    SERVICE_PROVIDER: 'Service Provider',
};

const permissions = {
    [ROLES.ADMIN]: {
        canViewDashboard: true,
        canViewOrders: true,
        canViewPartners: true,
        canViewRates: true,
        canManageRates: true,
        canManagePartners: true,
        canViewCustomers: true,
        canViewAllActivities: true,
        canExport: true,
        canAccessAuditLogs: true,
        canPerformBulkActions: true,
        canInlineEdit: true,
        canCreateOrder: false, // Admin doesn't create orders for customers
        canUpdateOrder: true, // For operational adjustments
    },
    [ROLES.CUSTOMER]: {
        canViewDashboard: true,
        canViewOrders: true,
        canViewPartners: false,
        canViewRates: true,
        canManageRates: false,
        canManagePartners: false,
        canViewCustomers: false,
        canViewOwnActivities: true,
        canExport: true, // Own orders
        canAccessAuditLogs: false,
        canPerformBulkActions: false,
        canInlineEdit: false,
        canCreateOrder: true,
        canUpdateOrder: true, // Own order (e.g. delivery option before acceptance)
    },
    [ROLES.SERVICE_PROVIDER]: {
        canViewDashboard: true,
        canViewOrders: true, // Own assigned orders
        canViewPartners: false,
        canViewRates: true,
        canManageRates: false,
        canManagePartners: false,
        canViewCustomers: false,
        canViewOwnActivities: true,
        canExport: true, // Own orders
        canAccessAuditLogs: false,
        canPerformBulkActions: false,
        canInlineEdit: true, // For status updates
        canCreateOrder: false,
        canUpdateOrder: true, // Status updates, mark delivered/picked
    },
};

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null); // { id: '...', name: '...', role: '...' }
    const [currentRole, setCurrentRole] = useState(null);

    const login = (role) => {
        let user;
        if (role === ROLES.ADMIN) {
            user = { id: 'admin1', name: 'Alice Admin', role: ROLES.ADMIN };
        } else if (role === ROLES.CUSTOMER) {
            user = { id: 'cust1', name: 'Bob Customer', role: ROLES.CUSTOMER };
        } else if (role === ROLES.SERVICE_PROVIDER) {
            user = { id: 'sp1', name: 'Charlie Ironer', role: ROLES.SERVICE_PROVIDER };
        }
        setCurrentUser(user);
        setCurrentRole(role);
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentRole(null);
    };

    const hasPermission = useCallback((action) => {
        if (!currentRole) return false;
        return permissions[currentRole]?.[action] || false;
    }, [currentRole]);

    const value = { currentUser, currentRole, login, logout, hasPermission, ROLES };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Dummy Data ---
let currentOrderId = 100;
let currentPartnerId = 10;
let currentRateId = 1;

const generateId = (prefix) => `${prefix}${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const DUMMY_DATA = {
    users: [
        { id: 'admin1', name: 'Alice Admin', role: ROLES.ADMIN, email: 'admin@ironeclipse.com' },
        { id: 'cust1', name: 'Bob Customer', role: ROLES.CUSTOMER, email: 'bob@example.com' },
        { id: 'cust2', name: 'Sarah Client', role: ROLES.CUSTOMER, email: 'sarah@example.com' },
        { id: 'sp1', name: 'Charlie Ironer', role: ROLES.SERVICE_PROVIDER, email: 'charlie@ironeclipse.com' },
        { id: 'sp2', name: 'Diana Presser', role: ROLES.SERVICE_PROVIDER, email: 'diana@ironeclipse.com' },
    ],
    partners: [
        { id: 'partner1', name: 'IronFast Services', contact: 'Charlie Ironer', email: 'charlie@ironeclipse.com', phone: '555-0101', status: 'Active', assignedOrders: 5 },
        { id: 'partner2', name: 'Smooth Press Inc.', contact: 'Diana Presser', email: 'diana@ironeclipse.com', phone: '555-0102', status: 'Active', assignedOrders: 3 },
        { id: 'partner3', name: 'CreaseAway Co.', contact: 'Eve Mender', email: 'eve@ironeclipse.com', phone: '555-0103', status: 'Inactive', assignedOrders: 0 },
    ],
    rates: [
        { id: 'rate1', clothType: 'Shirts', pricePerUnit: 2.50, minQty: 1, status: 'Active' },
        { id: 'rate2', clothType: 'Trousers', pricePerUnit: 3.00, minQty: 1, status: 'Active' },
        { id: 'rate3', clothType: 'Dresses', pricePerUnit: 5.00, minQty: 1, status: 'Active' },
        { id: 'rate4', clothType: 'Bed Sheets', pricePerUnit: 7.50, minQty: 1, status: 'Draft' },
    ],
    orders: [
        {
            id: 'ORD001', customerId: 'cust1', customerName: 'Bob Customer', serviceProviderId: 'sp1', serviceProviderName: 'Charlie Ironer',
            items: [{ type: 'Shirts', qty: 5, price: 2.50 }, { type: 'Trousers', qty: 2, price: 3.00 }],
            totalAmount: 18.50, deliveryOption: 'Doorstep', address: '123 Main St, Anytown',
            status: 'Accepted', createdAt: '2023-10-26T10:00:00Z', updatedAt: '2023-10-26T11:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-26T10:00:00Z', actor: 'Bob Customer' },
                { status: 'Accepted', timestamp: '2023-10-26T11:00:00Z', actor: 'Charlie Ironer' },
            ],
            slaDue: '2023-10-27T17:00:00Z', slaStatus: 'Within SLA',
            documents: [{ name: 'Order_001_Photo.jpg', url: 'https://via.placeholder.com/150/3498DB/FFFFFF?text=ORD001_Photo' }],
        },
        {
            id: 'ORD002', customerId: 'cust2', customerName: 'Sarah Client', serviceProviderId: null, serviceProviderName: null,
            items: [{ type: 'Dresses', qty: 2, price: 5.00 }],
            totalAmount: 10.00, deliveryOption: 'Customer Pickup', address: null,
            status: 'Created', createdAt: '2023-10-27T09:30:00Z', updatedAt: '2023-10-27T09:30:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-27T09:30:00Z', actor: 'Sarah Client' },
            ],
            slaDue: '2023-10-28T12:00:00Z', slaStatus: 'Within SLA',
            documents: [],
        },
        {
            id: 'ORD003', customerId: 'cust1', customerName: 'Bob Customer', serviceProviderId: 'sp1', serviceProviderName: 'Charlie Ironer',
            items: [{ type: 'Shirts', qty: 8, price: 2.50 }],
            totalAmount: 20.00, deliveryOption: 'Doorstep', address: '123 Main St, Anytown',
            status: 'Ironing', createdAt: '2023-10-25T14:00:00Z', updatedAt: '2023-10-26T09:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-25T14:00:00Z', actor: 'Bob Customer' },
                { status: 'Accepted', timestamp: '2023-10-25T15:00:00Z', actor: 'Charlie Ironer' },
                { status: 'Ironing', timestamp: '2023-10-26T09:00:00Z', actor: 'Charlie Ironer' },
            ],
            slaDue: '2023-10-27T10:00:00Z', slaStatus: 'Within SLA',
            documents: [],
        },
        {
            id: 'ORD004', customerId: 'cust2', customerName: 'Sarah Client', serviceProviderId: 'sp2', serviceProviderName: 'Diana Presser',
            items: [{ type: 'Trousers', qty: 3, price: 3.00 }, { type: 'Dresses', qty: 1, price: 5.00 }],
            totalAmount: 14.00, deliveryOption: 'Doorstep', address: '456 Oak Ave, Bigcity',
            status: 'Ready', createdAt: '2023-10-24T11:00:00Z', updatedAt: '2023-10-25T16:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-24T11:00:00Z', actor: 'Sarah Client' },
                { status: 'Accepted', timestamp: '2023-10-24T12:00:00Z', actor: 'Diana Presser' },
                { status: 'Ironing', timestamp: '2023-10-25T09:00:00Z', actor: 'Diana Presser' },
                { status: 'Ready', timestamp: '2023-10-25T16:00:00Z', actor: 'Diana Presser' },
            ],
            slaDue: '2023-10-26T18:00:00Z', slaStatus: 'Completed',
            documents: [],
        },
        {
            id: 'ORD005', customerId: 'cust1', customerName: 'Bob Customer', serviceProviderId: 'sp2', serviceProviderName: 'Diana Presser',
            items: [{ type: 'Shirts', qty: 10, price: 2.50 }],
            totalAmount: 25.00, deliveryOption: 'Doorstep', address: '123 Main St, Anytown',
            status: 'Delivered', createdAt: '2023-10-23T10:00:00Z', updatedAt: '2023-10-24T15:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-23T10:00:00Z', actor: 'Bob Customer' },
                { status: 'Accepted', timestamp: '2023-10-23T11:00:00Z', actor: 'Diana Presser' },
                { status: 'Ironing', timestamp: '2023-10-24T09:00:00Z', actor: 'Diana Presser' },
                { status: 'Ready', timestamp: '2023-10-24T14:00:00Z', actor: 'Diana Presser' },
                { status: 'Delivered', timestamp: '2023-10-24T15:00:00Z', actor: 'Diana Presser' },
            ],
            slaDue: '2023-10-24T16:00:00Z', slaStatus: 'Completed',
            documents: [],
        },
        {
            id: 'ORD006', customerId: 'cust2', customerName: 'Sarah Client', serviceProviderId: 'sp1', serviceProviderName: 'Charlie Ironer',
            items: [{ type: 'Bed Sheets', qty: 1, price: 7.50 }],
            totalAmount: 7.50, deliveryOption: 'Customer Pickup', address: null,
            status: 'Accepted', createdAt: '2023-10-27T14:00:00Z', updatedAt: '2023-10-27T15:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-27T14:00:00Z', actor: 'Sarah Client' },
                { status: 'Accepted', timestamp: '2023-10-27T15:00:00Z', actor: 'Charlie Ironer' },
            ],
            slaDue: '2023-10-28T18:00:00Z', slaStatus: 'SLA Breach', // Example of SLA breach for demo
            documents: [],
        },
        {
            id: 'ORD007', customerId: 'cust1', customerName: 'Bob Customer', serviceProviderId: null, serviceProviderName: null,
            items: [{ type: 'Trousers', qty: 4, price: 3.00 }],
            totalAmount: 12.00, deliveryOption: 'Doorstep', address: '123 Main St, Anytown',
            status: 'Created', createdAt: '2023-10-28T08:00:00Z', updatedAt: '2023-10-28T08:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-28T08:00:00Z', actor: 'Bob Customer' },
            ],
            slaDue: '2023-10-29T10:00:00Z', slaStatus: 'Within SLA',
            documents: [],
        },
        {
            id: 'ORD008', customerId: 'cust2', customerName: 'Sarah Client', serviceProviderId: 'sp2', serviceProviderName: 'Diana Presser',
            items: [{ type: 'Shirts', qty: 3, price: 2.50 }, { type: 'Dresses', qty: 1, price: 5.00 }],
            totalAmount: 12.50, deliveryOption: 'Customer Pickup', address: null,
            status: 'Picked', createdAt: '2023-10-22T09:00:00Z', updatedAt: '2023-10-23T11:00:00Z',
            timeline: [
                { status: 'Created', timestamp: '2023-10-22T09:00:00Z', actor: 'Sarah Client' },
                { status: 'Accepted', timestamp: '2023-10-22T10:00:00Z', actor: 'Diana Presser' },
                { status: 'Ironing', timestamp: '2023-10-23T08:00:00Z', actor: 'Diana Presser' },
                { status: 'Ready', timestamp: '2023-10-23T10:00:00Z', actor: 'Diana Presser' },
                { status: 'Picked', timestamp: '2023-10-23T11:00:00Z', actor: 'Sarah Client' },
            ],
            slaDue: '2023-10-23T12:00:00Z', slaStatus: 'Completed',
            documents: [],
        },
    ],
    activities: [
        { id: 'act1', type: 'Order Placed', entity: 'ORD007', role: ROLES.CUSTOMER, actor: 'Bob Customer', timestamp: '2023-10-28T08:00:00Z', status: 'info' },
        { id: 'act2', type: 'Order Accepted', entity: 'ORD006', role: ROLES.SERVICE_PROVIDER, actor: 'Charlie Ironer', timestamp: '2023-10-27T15:00:00Z', status: 'success' },
        { id: 'act3', type: 'Order Created', entity: 'ORD006', role: ROLES.CUSTOMER, actor: 'Sarah Client', timestamp: '2023-10-27T14:00:00Z', status: 'info' },
        { id: 'act4', type: 'Order Accepted', entity: 'ORD001', role: ROLES.SERVICE_PROVIDER, actor: 'Charlie Ironer', timestamp: '2023-10-26T11:00:00Z', status: 'success' },
        { id: 'act5', type: 'Order Ironing', entity: 'ORD003', role: ROLES.SERVICE_PROVIDER, actor: 'Charlie Ironer', timestamp: '2023-10-26T09:00:00Z', status: 'warning' },
        { id: 'act6', type: 'Rate Updated', entity: 'Shirts Rate', role: ROLES.ADMIN, actor: 'Alice Admin', timestamp: '2023-10-26T08:30:00Z', status: 'info' },
        { id: 'act7', type: 'Order Ready', entity: 'ORD004', role: ROLES.SERVICE_PROVIDER, actor: 'Diana Presser', timestamp: '2023-10-25T16:00:00Z', status: 'success' },
        { id: 'act8', type: 'Order Placed', entity: 'ORD003', role: ROLES.CUSTOMER, actor: 'Bob Customer', timestamp: '2023-10-25T14:00:00Z', status: 'info' },
        { id: 'act9', type: 'Order Delivered', entity: 'ORD005', role: ROLES.SERVICE_PROVIDER, actor: 'Diana Presser', timestamp: '2023-10-24T15:00:00Z', status: 'success' },
        { id: 'act10', type: 'New Partner Onboarded', entity: 'IronFast Services', role: ROLES.ADMIN, actor: 'Alice Admin', timestamp: '2023-10-24T10:00:00Z', status: 'success' },
    ],
    notifications: [],
};

// --- Utility Functions ---
const getStatusColor = (status) => {
    switch (status) {
        case 'Approved': case 'Completed': case 'Closed': case 'Ready': case 'Delivered': case 'Picked':
            return 'var(--status-green)';
        case 'In Progress': case 'Assigned': case 'Accepted': case 'Ironing':
            return 'var(--status-blue)';
        case 'Pending': case 'Action Required': case 'Scheduled': case 'Created':
            return 'var(--status-orange)'; // Use orange for initial 'Created' as it needs action
        case 'Rejected': case 'SLA Breach': case 'Blocked':
            return 'var(--status-red)';
        case 'Exception': case 'Escalation':
            return 'var(--status-purple)';
        case 'Draft': case 'Archived':
            return 'var(--status-grey)';
        default:
            return 'var(--status-grey)';
    }
};

const getStatusLightColor = (status) => {
    switch (status) {
        case 'Approved': case 'Completed': case 'Closed': case 'Ready': case 'Delivered': case 'Picked':
            return 'var(--status-light-green)';
        case 'In Progress': case 'Assigned': case 'Accepted': case 'Ironing':
            return 'var(--status-light-blue)';
        case 'Pending': case 'Action Required': case 'Scheduled': case 'Created':
            return 'var(--status-light-orange)';
        case 'Rejected': case 'SLA Breach': case 'Blocked':
            return 'var(--status-light-red)';
        case 'Exception': case 'Escalation':
            return 'var(--status-light-purple)';
        case 'Draft': case 'Archived':
            return 'var(--status-light-grey)';
        default:
            return 'var(--status-light-grey)';
    }
};


const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const options = {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: includeTime ? 'numeric' : undefined,
        minute: includeTime ? 'numeric' : undefined,
        hour12: true
    };
    return new Date(dateString).toLocaleString(undefined, options);
};

const calculateSLAStatus = (slaDue, status) => {
    if (status === 'Delivered' || status === 'Picked' || status === 'Completed') return 'Completed';
    if (!slaDue) return 'N/A';
    const now = new Date();
    const due = new Date(slaDue);
    if (now > due) {
        return 'SLA Breach';
    }
    return 'Within SLA';
};

// --- Reusable Components ---
const Button = ({ children, onClick, variant = 'primary', icon, disabled, type = 'button', className = '' }) => (
    <button
        onClick={onClick}
        className={`btn btn-${variant} ${className}`}
        disabled={disabled}
        type={type}
    >
        {icon && <span className="icon">{icon}</span>}
        {children}
    </button>
);

const KPICard = ({ title, value, icon, status, trend, badge, onClick, className = '' }) => {
    const kpiStatusClass = status ? `status-${status.replace(/\s/g, '-')}` : '';
    const trendClass = trend ? (trend > 0 ? 'positive' : 'negative') : '';
    const trendIcon = trend ? (trend > 0 ? Icons.TrendUp : Icons.TrendDown) : '';

    return (
        <div className={`kpi-card ${kpiStatusClass} ${className}`} onClick={onClick}>
            {badge && <span className="kpi-badge" style={{ backgroundColor: getStatusColor(badge) }}>{badge}</span>}
            <div className="kpi-icon">{icon}</div>
            <h4 className="kpi-title">{title}</h4>
            <p className="kpi-value">{value}</p>
            {trend !== undefined && trend !== null && (
                <div className={`kpi-trend ${trendClass}`}>
                    <span className="icon">{trendIcon}</span> {Math.abs(trend)}%
                </div>
            )}
        </div>
    );
};

const ColorfulCard = ({ data, onClick, type, role, ...props }) => {
    const { hasPermission } = useAuth();
    if (!data) return null;

    let title, subtitle, meta1, meta2, status, footerLeft, footerRight;

    switch (type) {
        case 'order':
            if (!hasPermission('canViewOrders') && data.customerId !== role) return null; // Role-based record access
            title = `Order #${data.id}`;
            subtitle = data.customerName;
            meta1 = `Total: ${formatCurrency(data.totalAmount)}`;
            meta2 = `Delivery: ${data.deliveryOption}`;
            status = data.status;
            footerLeft = `Created: ${formatDate(data.createdAt, false)}`;
            footerRight = data.serviceProviderName || 'Unassigned';
            break;
        case 'partner':
            if (!hasPermission('canViewPartners')) return null;
            title = data.name;
            subtitle = `Contact: ${data.contact}`;
            meta1 = `Email: ${data.email}`;
            meta2 = `Orders: ${data.assignedOrders}`;
            status = data.status;
            footerLeft = `Status: ${data.status}`;
            footerRight = `ID: ${data.id}`;
            break;
        case 'rate':
            if (!hasPermission('canViewRates')) return null;
            title = data.clothType;
            subtitle = `Price: ${formatCurrency(data.pricePerUnit)} per unit`;
            meta1 = `Min Qty: ${data.minQty}`;
            meta2 = `Status: ${data.status}`;
            status = data.status;
            footerLeft = `ID: ${data.id}`;
            footerRight = data.status;
            break;
        case 'activity':
            if (role === ROLES.CUSTOMER && !data.entity.includes(role)) return null; // Only show own activities
            title = data.type;
            subtitle = `For: ${data.entity}`;
            meta1 = `Actor: ${data.actor}`;
            meta2 = `Time: ${formatDate(data.timestamp)}`;
            status = data.status; // This will be like 'info', 'success', 'warning'
            footerLeft = 'Recent Activity';
            footerRight = data.actor;
            break;
        default:
            return null;
    }

    const cardStatusClass = status ? `status-${status.replace(/\s/g, '-')}` : '';

    return (
        <div className={`colorful-card ${cardStatusClass}`} onClick={() => onClick(data.id)} {...props}>
            <div className="card-header-color" style={{ backgroundColor: getStatusColor(status) }}>
                <span>{title}</span>
                <span className={`status-badge ${cardStatusClass}`}>{status}</span>
            </div>
            <div className="card-content">
                <h4 className="card-title">{subtitle}</h4>
                <p className="card-meta">
                    <span>{meta1}</span>
                    <span>{meta2}</span>
                </p>
            </div>
            <div className="card-footer">
                <span>{footerLeft}</span>
                <span>{footerRight}</span>
            </div>
        </div>
    );
};

const Notifications = ({ notifications, dismissNotification }) => (
    <div className="notification-container">
        {notifications.map(notification => (
            <div key={notification.id} className={`toast toast-${notification.type}`} role="alert">
                <span className="toast-icon">
                    {notification.type === 'success' && Icons.Check}
                    {notification.type === 'info' && Icons.Info}
                    {notification.type === 'warning' && Icons.Warning}
                    {notification.type === 'error' && Icons.Error}
                </span>
                <div className="toast-message">{notification.message}</div>
                <button className="toast-close-btn" onClick={() => dismissNotification(notification.id)}>
                    {Icons.Close}
                </button>
            </div>
        ))}
    </div>
);

// --- Forms ---
const AccordionSection = ({ title, children, isExpanded, onToggle }) => (
    <div className="accordion-section">
        <div className="accordion-header" onClick={onToggle}>
            <span>{title}</span>
            <span className="icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
            {children}
        </div>
    </div>
);

const FormConfirmation = ({ message, details, onReturn, onNew }) => (
    <div className="confirmation-screen fade-in">
        <span className="icon">{Icons.Success}</span>
        <h3>{message}</h3>
        <p>{details}</p>
        <div className="btn-group">
            <Button onClick={onReturn} variant="outline">Back to Dashboard</Button>
            {onNew && <Button onClick={onNew} variant="primary">Create New</Button>}
        </div>
    </div>
);

const CustomerOrderForm = ({ order = {}, onSave, onCancel, currentUserId, currentUserName }) => {
    const isEditing = !!order.id;
    const [formData, setFormData] = useState({
        customerId: order.customerId || currentUserId,
        customerName: order.customerName || currentUserName,
        deliveryOption: order.deliveryOption || 'Doorstep',
        address: order.address || '',
        items: order.items || [{ type: '', qty: 1, price: 0 }],
        notes: order.notes || '',
    });
    const [errors, setErrors] = useState({});
    const [expandedSection, setExpandedSection] = useState('order_details'); // Default to first section

    const rates = DUMMY_DATA.rates.filter(r => r.status === 'Active');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'type') {
            const selectedRate = rates.find(r => r.clothType === value);
            newItems[index].price = selectedRate ? selectedRate.pricePerUnit : 0;
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { type: '', qty: 1, price: 0 }]
        }));
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.customerId) newErrors.customerId = 'Customer ID is required.';
        if (!formData.customerName) newErrors.customerName = 'Customer Name is required.';
        if (!formData.deliveryOption) newErrors.deliveryOption = 'Delivery option is required.';
        if (formData.deliveryOption === 'Doorstep' && !formData.address) {
            newErrors.address = 'Delivery address is required for doorstep delivery.';
        }
        if (formData.items.length === 0) {
            newErrors.items = 'At least one item is required.';
        } else {
            formData.items.forEach((item, index) => {
                if (!item.type) newErrors[`itemType${index}`] = 'Cloth type is required.';
                if (item.qty <= 0) newErrors[`itemQty${index}`] = 'Quantity must be greater than 0.';
            });
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const totalAmount = formData.items.reduce((sum, item) => sum + item.qty * item.price, 0);
            onSave({ ...formData, totalAmount, id: isEditing ? order.id : undefined });
        }
    };

    return (
        <div className="form-page slide-in-right">
            <h2 className="page-header">{isEditing ? `Edit Order #${order.id}` : 'Place New Ironing Order'}</h2>
            <form onSubmit={handleSubmit}>
                <AccordionSection
                    title="Order Details"
                    isExpanded={expandedSection === 'order_details'}
                    onToggle={() => setExpandedSection(expandedSection === 'order_details' ? '' : 'order_details')}
                >
                    <div className="form-group">
                        <label className="form-label">Customer Name:</label>
                        <input
                            type="text"
                            name="customerName"
                            value={formData.customerName}
                            readOnly
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Delivery Option:</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    name="deliveryOption"
                                    value="Doorstep"
                                    checked={formData.deliveryOption === 'Doorstep'}
                                    onChange={handleChange}
                                />
                                Doorstep Delivery {Icons.Truck}
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="deliveryOption"
                                    value="Customer Pickup"
                                    checked={formData.deliveryOption === 'Customer Pickup'}
                                    onChange={handleChange}
                                />
                                Customer Pickup {Icons.Bag}
                            </label>
                        </div>
                        {errors.deliveryOption && <span className="validation-message">{errors.deliveryOption}</span>}
                    </div>
                    {formData.deliveryOption === 'Doorstep' && (
                        <div className="form-group">
                            <label className="form-label">Delivery Address:</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={`form-textarea ${errors.address ? 'invalid' : ''}`}
                                placeholder="Enter full address"
                            />
                            {errors.address && <span className="validation-message">{errors.address}</span>}
                        </div>
                    )}
                </AccordionSection>

                <AccordionSection
                    title="Items to Iron"
                    isExpanded={expandedSection === 'items'}
                    onToggle={() => setExpandedSection(expandedSection === 'items' ? '' : 'items')}
                >
                    {formData.items.map((item, index) => (
                        <div key={index} className="form-group" style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ flex: 3 }}>
                                <label className="form-label">Cloth Type:</label>
                                <select
                                    name={`type-${index}`}
                                    value={item.type}
                                    onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                                    className={`form-select ${errors[`itemType${index}`] ? 'invalid' : ''}`}
                                >
                                    <option value="">Select type</option>
                                    {rates.map(r => (
                                        <option key={r.id} value={r.clothType}>{r.clothType}</option>
                                    ))}
                                </select>
                                {errors[`itemType${index}`] && <span className="validation-message">{errors[`itemType${index}`]}</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Qty:</label>
                                <input
                                    type="number"
                                    name={`qty-${index}`}
                                    value={item.qty}
                                    onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                    className={`form-input ${errors[`itemQty${index}`] ? 'invalid' : ''}`}
                                    min="1"
                                />
                                {errors[`itemQty${index}`] && <span className="validation-message">{errors[`itemQty${index}`]}</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Price/Unit:</label>
                                <input type="text" value={formatCurrency(item.price)} readOnly className="form-input" />
                            </div>
                            <Button type="button" onClick={() => removeItem(index)} variant="outline" className="btn-icon" style={{ marginTop: 'var(--spacing-lg)' }}>{Icons.Delete}</Button>
                        </div>
                    ))}
                    {errors.items && <span className="validation-message">{errors.items}</span>}
                    <Button type="button" onClick={addItem} variant="secondary" icon={Icons.Add}>Add Item</Button>
                </AccordionSection>

                <AccordionSection
                    title="Additional Notes"
                    isExpanded={expandedSection === 'notes'}
                    onToggle={() => setExpandedSection(expandedSection === 'notes' ? '' : 'notes')}
                >
                    <div className="form-group">
                        <label className="form-label">Notes:</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="form-textarea"
                            rows="3"
                            placeholder="Any specific instructions?"
                        />
                    </div>
                </AccordionSection>

                <div className="form-footer">
                    <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
                    <Button type="submit" variant="primary">{isEditing ? 'Update Order' : 'Place Order'}</Button>
                </div>
            </form>
        </div>
    );
};

const ServiceProviderOrderUpdateForm = ({ order, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        status: order.status,
        notes: order.notes || '',
        deliveryProof: order.deliveryProof || [],
    });
    const [errors, setErrors] = useState({});
    const [expandedSection, setExpandedSection] = useState('status_update');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({
            ...prev,
            deliveryProof: [...prev.deliveryProof, ...files.map(file => ({ name: file.name, url: URL.createObjectURL(file) }))]
        }));
    };

    const removeFile = (fileUrl) => {
        setFormData(prev => ({
            ...prev,
            deliveryProof: prev.deliveryProof.filter(f => f.url !== fileUrl)
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.status) newErrors.status = 'Status is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave({ ...formData, id: order.id });
        }
    };

    const workflowStatuses = ['Accepted', 'Ironing', 'Ready', 'Delivered', 'Picked'];
    const currentStatusIndex = workflowStatuses.indexOf(order.status);
    const availableStatuses = workflowStatuses.slice(currentStatusIndex);

    return (
        <div className="form-page slide-in-right">
            <h2 className="page-header">Update Order #{order.id}</h2>
            <form onSubmit={handleSubmit}>
                <AccordionSection
                    title="Order Status Update"
                    isExpanded={expandedSection === 'status_update'}
                    onToggle={() => setExpandedSection(expandedSection === 'status_update' ? '' : 'status_update')}
                >
                    <div className="form-group">
                        <label className="form-label">Current Status:</label>
                        <input type="text" value={order.status} readOnly className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Status:</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={`form-select ${errors.status ? 'invalid' : ''}`}
                        >
                            {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.status && <span className="validation-message">{errors.status}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Internal Notes:</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="form-textarea"
                            rows="3"
                        />
                    </div>
                </AccordionSection>

                {(formData.status === 'Delivered' || formData.status === 'Picked') && (
                    <AccordionSection
                        title="Delivery/Pickup Proof"
                        isExpanded={expandedSection === 'proof'}
                        onToggle={() => setExpandedSection(expandedSection === 'proof' ? '' : 'proof')}
                    >
                        <div className="form-group">
                            <label className="form-label">Upload Proof (e.g., photo):</label>
                            <div className="file-upload-container" onClick={() => document.getElementById('file-upload').click()}>
                                <span className="icon">{Icons.Upload}</span>
                                <p className="file-upload-text">Drag & drop files here or click to browse</p>
                                <input id="file-upload" type="file" multiple onChange={handleFileChange} />
                            </div>
                            <ul className="file-list">
                                {formData.deliveryProof.map((file, index) => (
                                    <li key={index} className="file-list-item">
                                        <span><span className="icon">{Icons.File}</span> {file.name}</span>
                                        <Button type="button" onClick={() => removeFile(file.url)} variant="icon">{Icons.Close}</Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AccordionSection>
                )}

                <div className="form-footer">
                    <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
                    <Button type="submit" variant="primary">Update Order</Button>
                </div>
            </form>
        </div>
    );
};

const AdminRateSetupForm = ({ rate = {}, onSave, onCancel }) => {
    const isEditing = !!rate.id;
    const [formData, setFormData] = useState({
        clothType: rate.clothType || '',
        pricePerUnit: rate.pricePerUnit || '',
        minQty: rate.minQty || 1,
        status: rate.status || 'Active',
    });
    const [errors, setErrors] = useState({});
    const [expandedSection, setExpandedSection] = useState('rate_details');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.clothType) newErrors.clothType = 'Cloth Type is required.';
        if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
            newErrors.pricePerUnit = 'Price per unit must be a positive number.';
        }
        if (formData.minQty <= 0) newErrors.minQty = 'Minimum quantity must be greater than 0.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave({ ...formData, id: isEditing ? rate.id : undefined });
        }
    };

    return (
        <div className="form-page slide-in-right">
            <h2 className="page-header">{isEditing ? `Edit Rate for ${rate.clothType}` : 'Setup New Rate'}</h2>
            <form onSubmit={handleSubmit}>
                <AccordionSection
                    title="Rate Details"
                    isExpanded={expandedSection === 'rate_details'}
                    onToggle={() => setExpandedSection(expandedSection === 'rate_details' ? '' : 'rate_details')}
                >
                    <div className="form-group">
                        <label className="form-label">Cloth Type:</label>
                        <input
                            type="text"
                            name="clothType"
                            value={formData.clothType}
                            onChange={handleChange}
                            className={`form-input ${errors.clothType ? 'invalid' : ''}`}
                            placeholder="e.g., Shirts, Trousers"
                        />
                        {errors.clothType && <span className="validation-message">{errors.clothType}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Price Per Unit ({Icons.Dollar}):</label>
                        <input
                            type="number"
                            name="pricePerUnit"
                            value={formData.pricePerUnit}
                            onChange={handleChange}
                            className={`form-input ${errors.pricePerUnit ? 'invalid' : ''}`}
                            step="0.01"
                            min="0"
                        />
                        {errors.pricePerUnit && <span className="validation-message">{errors.pricePerUnit}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Minimum Quantity:</label>
                        <input
                            type="number"
                            name="minQty"
                            value={formData.minQty}
                            onChange={handleChange}
                            className={`form-input ${errors.minQty ? 'invalid' : ''}`}
                            min="1"
                        />
                        {errors.minQty && <span className="validation-message">{errors.minQty}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status:</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </AccordionSection>

                <div className="form-footer">
                    <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
                    <Button type="submit" variant="primary">{isEditing ? 'Update Rate' : 'Save Rate'}</Button>
                </div>
            </form>
        </div>
    );
};

const AdminPartnerSetupForm = ({ partner = {}, onSave, onCancel }) => {
    const isEditing = !!partner.id;
    const [formData, setFormData] = useState({
        name: partner.name || '',
        contact: partner.contact || '',
        email: partner.email || '',
        phone: partner.phone || '',
        status: partner.status || 'Active',
    });
    const [errors, setErrors] = useState({});
    const [expandedSection, setExpandedSection] = useState('partner_details');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Partner Name is required.';
        if (!formData.contact) newErrors.contact = 'Contact Person is required.';
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required.';
        if (!formData.phone || !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) newErrors.phone = 'Phone number is required (e.g., 555-123-4567).';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave({ ...formData, id: isEditing ? partner.id : generateId('partner') });
        }
    };

    return (
        <div className="form-page slide-in-right">
            <h2 className="page-header">{isEditing ? `Edit Partner: ${partner.name}` : 'Setup New Partner'}</h2>
            <form onSubmit={handleSubmit}>
                <AccordionSection
                    title="Partner Details"
                    isExpanded={expandedSection === 'partner_details'}
                    onToggle={() => setExpandedSection(expandedSection === 'partner_details' ? '' : 'partner_details')}
                >
                    <div className="form-group">
                        <label className="form-label">Partner Name:</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`form-input ${errors.name ? 'invalid' : ''}`}
                            placeholder="e.g., IronFast Services"
                        />
                        {errors.name && <span className="validation-message">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contact Person:</label>
                        <input
                            type="text"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className={`form-input ${errors.contact ? 'invalid' : ''}`}
                            placeholder="e.g., Jane Doe"
                        />
                        {errors.contact && <span className="validation-message">{errors.contact}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`form-input ${errors.email ? 'invalid' : ''}`}
                            placeholder="e.g., contact@ironfast.com"
                        />
                        {errors.email && <span className="validation-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone:</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`form-input ${errors.phone ? 'invalid' : ''}`}
                            placeholder="e.g., 555-123-4567"
                            pattern="^\d{3}-\d{3}-\d{4}$"
                        />
                        {errors.phone && <span className="validation-message">{errors.phone}</span>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status:</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </AccordionSection>

                <div className="form-footer">
                    <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
                    <Button type="submit" variant="primary">{isEditing ? 'Update Partner' : 'Add Partner'}</Button>
                </div>
            </form>
        </div>
    );
};


// --- Detail Views ---
const OrderDetailScreen = ({ order, onBack, onAction, currentUser, hasPermission }) => {
    if (!order) return null;

    const [isEditingDelivery, setIsEditingDelivery] = useState(false);
    const [tempDeliveryOption, setTempDeliveryOption] = useState(order.deliveryOption);
    const [tempAddress, setTempAddress] = useState(order.address || '');

    const handleDeliveryUpdate = () => {
        if (tempDeliveryOption === 'Doorstep' && !tempAddress) {
            alert('Address is required for doorstep delivery.');
            return;
        }
        onAction('updateDelivery', {
            orderId: order.id,
            deliveryOption: tempDeliveryOption,
            address: tempAddress,
        });
        setIsEditingDelivery(false);
    };

    const isCustomerOwner = currentUser.id === order.customerId;
    const isServiceProviderAssigned = currentUser.id === order.serviceProviderId;

    const workflowStages = ['Created', 'Accepted', 'Ironing', 'Ready', 'Delivered', 'Picked'];
    const currentStageIndex = workflowStages.indexOf(order.status);

    const getStageColor = (stage) => {
        if (workflowStages.indexOf(stage) < currentStageIndex) return 'var(--status-green)';
        if (stage === order.status) return 'var(--status-blue)';
        return 'var(--status-grey)';
    };

    const getStageIcon = (stage) => {
        if (workflowStages.indexOf(stage) < currentStageIndex) return Icons.Check;
        if (stage === order.status) return Icons.Clock;
        return '';
    };

    const canCustomerEditDelivery = isCustomerOwner && (order.status === 'Created' || order.status === 'Pending');

    return (
        <div className="full-screen-page slide-in-right">
            <div className="page-header">
                <h2><Button onClick={onBack} variant="icon" className="btn-icon">{Icons.ChevronLeft}</Button> Order Details: {order.id}</h2>
                <div className="page-actions">
                    {hasPermission('canUpdateOrder') && (isServiceProviderAssigned && order.status === 'Created') && (
                        <Button onClick={() => onAction('acceptOrder', order.id)} variant="primary" icon={Icons.Accept}>Accept Order</Button>
                    )}
                    {hasPermission('canUpdateOrder') && (isServiceProviderAssigned && order.status === 'Accepted') && (
                        <Button onClick={() => onAction('markIroning', order.id)} variant="primary" icon={Icons.Iron}>Mark Ironing</Button>
                    )}
                    {hasPermission('canUpdateOrder') && (isServiceProviderAssigned && order.status === 'Ironing') && (
                        <Button onClick={() => onAction('markReady', order.id)} variant="primary" icon={Icons.Ready}>Mark Ready</Button>
                    )}
                    {hasPermission('canUpdateOrder') && (isServiceProviderAssigned && order.status === 'Ready') && (
                        <>
                            <Button onClick={() => onAction('openUpdateForm', order.id)} variant="primary" icon={Icons.Deliver}>Mark Delivered / Picked</Button>
                        </>
                    )}
                    {canCustomerEditDelivery && (
                        <Button onClick={() => setIsEditingDelivery(true)} variant="outline" icon={Icons.Edit}>Edit Delivery</Button>
                    )}
                    {hasPermission('canUpdateOrder') && (isServiceProviderAssigned) && (
                        <Button onClick={() => onAction('openUpdateForm', order.id)} variant="outline" icon={Icons.Edit}>Update Status</Button>
                    )}
                </div>
            </div>

            <div className="page-content">
                <div className="detail-section-group">
                    <div className="detail-card">
                        <h3>Order Information</h3>
                        <div className="detail-item">
                            <span className="detail-label">Customer</span>
                            <span className="detail-value">{order.customerName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Service Provider</span>
                            <span className="detail-value">{order.serviceProviderName || 'Unassigned'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Total Amount</span>
                            <span className="detail-value">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Delivery Option</span>
                            {isEditingDelivery ? (
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                                    <select value={tempDeliveryOption} onChange={(e) => setTempDeliveryOption(e.target.value)} className="form-select" style={{width: '180px', marginBottom: '8px'}}>
                                        <option value="Doorstep">Doorstep</option>
                                        <option value="Customer Pickup">Customer Pickup</option>
                                    </select>
                                    {tempDeliveryOption === 'Doorstep' && (
                                        <textarea value={tempAddress} onChange={(e) => setTempAddress(e.target.value)} className="form-textarea" placeholder="Address" style={{width: '180px', marginBottom: '8px'}} />
                                    )}
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <Button onClick={handleDeliveryUpdate} variant="primary" size="small">Save</Button>
                                        <Button onClick={() => setIsEditingDelivery(false)} variant="outline" size="small">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <span className="detail-value">{order.deliveryOption}</span>
                            )}
                        </div>
                        {order.deliveryOption === 'Doorstep' && (
                            <div className="detail-item">
                                <span className="detail-label">Address</span>
                                <span className="detail-value">{order.address}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="detail-label">Created At</span>
                            <span className="detail-value">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Last Updated</span>
                            <span className="detail-value">{formatDate(order.updatedAt)}</span>
                        </div>
                    </div>

                    <div className="detail-card">
                        <h3>Items</h3>
                        {order.items.map((item, index) => (
                            <div key={index} className="detail-item">
                                <span className="detail-label">{item.type} (x{item.qty})</span>
                                <span className="detail-value">{formatCurrency(item.qty * item.price)}</span>
                            </div>
                        ))}
                    </div>

                    {order.documents && order.documents.length > 0 && (
                        <div className="detail-card">
                            <h3>Documents</h3>
                            <ul className="file-list" style={{border: 'none', padding: 0}}>
                                {order.documents.map((doc, index) => (
                                    <li key={index} className="file-list-item" style={{backgroundColor: 'var(--bg-light)'}}>
                                        <span><span className="icon">{Icons.File}</span> {doc.name}</span>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{color: 'var(--color-primary)'}}>
                                            {Icons.Search}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="detail-section-group">
                    <div className="detail-card">
                        <h3>Workflow Timeline</h3>
                        <div className="workflow-stepper">
                            {workflowStages.map((stage, index) => {
                                const timelineEntry = order.timeline.find(t => t.status === stage);
                                const isCompleted = workflowStages.indexOf(stage) < currentStageIndex;
                                const isCurrent = stage === order.status;
                                const slaStatus = calculateSLAStatus(order.slaDue, stage);
                                const showSlaBreach = (stage === order.status || isCompleted) && slaStatus === 'SLA Breach';

                                return (
                                    <div key={stage} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                        <div className="step-marker" style={{ backgroundColor: getStageColor(stage) }}>
                                            {getStageIcon(stage)}
                                        </div>
                                        <div className="step-content">
                                            <div className="step-title">{stage}</div>
                                            {timelineEntry && (
                                                <div className="step-info">
                                                    {formatDate(timelineEntry.timestamp)} by {timelineEntry.actor}
                                                </div>
                                            )}
                                            {isCurrent && order.slaDue && (
                                                <div className="step-info">
                                                    SLA Due: {formatDate(order.slaDue)}
                                                </div>
                                            )}
                                            {showSlaBreach && (
                                                <div className="sla-badge">{Icons.Warning} SLA BREACH</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {hasPermission('canAccessAuditLogs') && (
                        <div className="detail-card">
                            <h3>Audit Log (Admin Only)</h3>
                            {order.timeline.map((entry, index) => (
                                <div key={index} className="detail-item">
                                    <span className="detail-label">{entry.status}</span>
                                    <span className="detail-value">{formatDate(entry.timestamp)} by {entry.actor}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Dashboards ---
const Dashboard = ({ orders, partners, rates, activities, currentUser, hasPermission, navigateTo, showNotification }) => {
    const { role } = currentUser;

    // Filter data based on user role
    const customerOrders = orders.filter(o => o.customerId === currentUser.id);
    const serviceProviderOrders = orders.filter(o => o.serviceProviderId === currentUser.id);
    const recentActivities = activities.filter(act => {
        if (role === ROLES.ADMIN) return true;
        if (role === ROLES.CUSTOMER) return act.actor === currentUser.name;
        if (role === ROLES.SERVICE_PROVIDER) return act.actor === currentUser.name;
        return false;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    // KPI Calculations
    let kpis = [];
    let dashboardCharts = [];
    let taskQueueData = [];
    let upcomingDeadlines = [];

    if (role === ROLES.CUSTOMER) {
        const ordersPlaced = customerOrders.length;
        const ordersReady = customerOrders.filter(o => o.status === 'Ready' || o.status === 'Delivered' || o.status === 'Picked').length;

        kpis = [
            { title: 'Orders Placed', value: ordersPlaced, icon: Icons.Orders, status: 'info' },
            { title: 'Orders Ready', value: ordersReady, icon: Icons.Ready, status: ordersReady > 0 ? 'success' : 'info' },
        ];

        dashboardCharts = [
            {
                type: 'bar',
                title: 'Order Status Breakdown',
                data: {
                    labels: ['Created', 'Accepted', 'Ironing', 'Ready', 'Delivered', 'Picked'],
                    datasets: [{
                        label: 'Orders',
                        data: [
                            customerOrders.filter(o => o.status === 'Created').length,
                            customerOrders.filter(o => o.status === 'Accepted').length,
                            customerOrders.filter(o => o.status === 'Ironing').length,
                            customerOrders.filter(o => o.status === 'Ready').length,
                            customerOrders.filter(o => o.status === 'Delivered').length,
                            customerOrders.filter(o => o.status === 'Picked').length,
                        ],
                        backgroundColor: [getStatusColor('Created'), getStatusColor('Accepted'), getStatusColor('Ironing'), getStatusColor('Ready'), getStatusColor('Delivered'), getStatusColor('Picked')],
                        borderColor: [getStatusColor('Created'), getStatusColor('Accepted'), getStatusColor('Ironing'), getStatusColor('Ready'), getStatusColor('Delivered'), getStatusColor('Picked')],
                        borderWidth: 1,
                    }]
                }
            }
        ];

        taskQueueData = customerOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Picked').map(o => ({
            id: o.id,
            title: `Order #${o.id} - ${o.customerName}`,
            meta: `Status: ${o.status}`,
            status: o.status,
            priority: o.status === 'Created' ? 'high' : 'medium', // customer created needs SP action
            onClick: () => navigateTo('orderDetail', o.id),
        }));

        upcomingDeadlines = customerOrders.filter(o => o.slaDue && o.slaStatus === 'Within SLA' && o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Picked')
            .map(o => ({
                id: o.id,
                title: `Order #${o.id}`,
                dueDate: new Date(o.slaDue),
                status: o.status,
            }))
            .sort((a, b) => a.dueDate - b.dueDate);

    } else if (role === ROLES.SERVICE_PROVIDER) {
        const ordersReceived = serviceProviderOrders.length;
        const ordersInProgress = serviceProviderOrders.filter(o => o.status === 'Accepted' || o.status === 'Ironing').length;
        const ordersCompleted = serviceProviderOrders.filter(o => o.status === 'Ready' || o.status === 'Delivered' || o.status === 'Picked').length;
        const deliveriesScheduled = serviceProviderOrders.filter(o => (o.status === 'Ready' || o.status === 'Accepted' || o.status === 'Ironing') && o.deliveryOption === 'Doorstep').length;

        kpis = [
            { title: 'Orders Received', value: ordersReceived, icon: Icons.Orders, status: 'info' },
            { title: 'Orders In Progress', value: ordersInProgress, icon: Icons.Clock, status: ordersInProgress > 0 ? 'blue' : 'info' },
            { title: 'Orders Completed', value: ordersCompleted, icon: Icons.Check, status: ordersCompleted > 0 ? 'green' : 'info' },
            { title: 'Deliveries Scheduled', value: deliveriesScheduled, icon: Icons.Truck, status: deliveriesScheduled > 0 ? 'orange' : 'info' },
        ];

        dashboardCharts = [
            {
                type: 'pie',
                title: 'Orders by Status',
                data: {
                    labels: ['Created (unassigned)', 'Accepted', 'Ironing', 'Ready', 'Delivered', 'Picked'],
                    datasets: [{
                        data: [
                            orders.filter(o => !o.serviceProviderId && o.status === 'Created').length, // Unassigned
                            serviceProviderOrders.filter(o => o.status === 'Accepted').length,
                            serviceProviderOrders.filter(o => o.status === 'Ironing').length,
                            serviceProviderOrders.filter(o => o.status === 'Ready').length,
                            serviceProviderOrders.filter(o => o.status === 'Delivered').length,
                            serviceProviderOrders.filter(o => o.status === 'Picked').length,
                        ],
                        backgroundColor: [getStatusColor('Created'), getStatusColor('Accepted'), getStatusColor('Ironing'), getStatusColor('Ready'), getStatusColor('Delivered'), getStatusColor('Picked')],
                    }]
                }
            },
            {
                type: 'bar',
                title: 'Delivery vs Pickup',
                data: {
                    labels: ['Doorstep', 'Customer Pickup'],
                    datasets: [{
                        label: 'Orders',
                        data: [
                            serviceProviderOrders.filter(o => o.deliveryOption === 'Doorstep').length,
                            serviceProviderOrders.filter(o => o.deliveryOption === 'Customer Pickup').length,
                        ],
                        backgroundColor: [varToString('--color-primary'), varToString('--color-secondary')],
                    }]
                }
            }
        ];

        taskQueueData = serviceProviderOrders.filter(o => o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Picked').map(o => ({
            id: o.id,
            title: `Order #${o.id} for ${o.customerName}`,
            meta: `Current Status: ${o.status}`,
            status: o.status,
            priority: (o.slaStatus === 'SLA Breach' || o.status === 'Accepted') ? 'high' : 'medium',
            onClick: () => navigateTo('orderDetail', o.id),
        })).concat(
            orders.filter(o => !o.serviceProviderId && o.status === 'Created').map(o => ({
                id: o.id,
                title: `New Order #${o.id} (Unassigned)`,
                meta: `Customer: ${o.customerName}`,
                status: 'Created',
                priority: 'high',
                onClick: () => navigateTo('orderDetail', o.id),
            }))
        ).sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
        });

        upcomingDeadlines = serviceProviderOrders.filter(o => o.slaDue && o.slaStatus === 'Within SLA' && o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Picked')
            .map(o => ({
                id: o.id,
                title: `Order #${o.id}`,
                dueDate: new Date(o.slaDue),
                status: o.status,
            }))
            .sort((a, b) => a.dueDate - b.dueDate);


    } else if (role === ROLES.ADMIN) {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const avgTurnaroundTime = orders.filter(o => o.timeline.length > 1 && (o.status === 'Delivered' || o.status === 'Picked'))
                                        .reduce((sum, o) => {
                                            const created = new Date(o.timeline[0].timestamp);
                                            const completed = new Date(o.timeline[o.timeline.length - 1].timestamp);
                                            return sum + (completed - created);
                                        }, 0) / (orders.filter(o => o.timeline.length > 1 && (o.status === 'Delivered' || o.status === 'Picked')).length || 1);
        const avgTatHours = avgTurnaroundTime / (1000 * 60 * 60);

        const deliveryCount = orders.filter(o => o.deliveryOption === 'Doorstep').length;
        const pickupCount = orders.filter(o => o.deliveryOption === 'Customer Pickup').length;

        kpis = [
            { title: 'Total Orders', value: totalOrders, icon: Icons.Orders, status: 'info' },
            { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: Icons.Dollar, status: 'success' },
            { title: 'Avg Turnaround Time', value: avgTatHours.toFixed(1) + ' hrs', icon: Icons.Gauge, status: avgTatHours > 24 ? 'red' : 'green' },
            { title: 'Delivery vs Pickup', value: `${deliveryCount} / ${pickupCount}`, icon: Icons.Truck, status: 'blue' },
        ];

        dashboardCharts = [
            {
                type: 'line',
                title: 'Revenue Trend (Last 7 Days)',
                data: {
                    labels: ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'],
                    datasets: [{
                        label: 'Revenue',
                        data: [150, 200, 180, 250, 220, 300, 280], // Dummy trend data
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: varToString('--color-primary'),
                        tension: 0.3,
                    }]
                }
            },
            {
                type: 'pie',
                title: 'Delivery vs Pickup',
                data: {
                    labels: ['Doorstep Delivery', 'Customer Pickup'],
                    datasets: [{
                        data: [deliveryCount, pickupCount],
                        backgroundColor: [varToString('--color-primary'), varToString('--color-secondary')],
                    }]
                }
            }
        ];

        taskQueueData = orders.filter(o => o.status === 'Created' || o.status === 'Accepted' || o.status === 'Ironing' || o.slaStatus === 'SLA Breach').map(o => ({
            id: o.id,
            title: `Order #${o.id} - ${o.customerName}`,
            meta: `Status: ${o.status}, SP: ${o.serviceProviderName || 'N/A'}`,
            status: o.status,
            priority: (o.slaStatus === 'SLA Breach' || o.status === 'Created') ? 'high' : 'medium',
            onClick: () => navigateTo('orderDetail', o.id),
        }));

        upcomingDeadlines = orders.filter(o => o.slaDue && o.slaStatus === 'Within SLA' && o.status !== 'Ready' && o.status !== 'Delivered' && o.status !== 'Picked')
            .map(o => ({
                id: o.id,
                title: `Order #${o.id}`,
                dueDate: new Date(o.slaDue),
                status: o.status,
            }))
            .sort((a, b) => a.dueDate - b.dueDate);
    }

    // Dummy Chart component (replace with actual chart library if needed)
    const Chart = ({ type, title, data }) => (
        <div className="chart-container">
            <h3 className="chart-title">{title}</h3>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: varToString('--text-secondary') }}>
                <p>({type} chart placeholder)</p>
                <pre style={{fontSize: '0.7em', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: '150px'}}>{JSON.stringify(data, null, 2)}</pre>
            </div>
        </div>
    );

    function varToString(cssVar) {
        if (typeof document !== 'undefined') {
            return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        }
        return ''; // Fallback for SSR or non-browser environments
    }

    return (
        <div className="main-dashboard fade-in">
            <div className="dashboard-main-area">
                <h2 style={{ marginBottom: varToString('--spacing-xl') }}>{role} Dashboard</h2>
                <div className="kpi-grid">
                    {kpis.map((kpi, index) => (
                        <KPICard key={index} {...kpi} onClick={() => showNotification('info', `Drill-down for ${kpi.title} is not enabled for this KPI per project spec, but cards are clickable.`)} />
                    ))}
                </div>

                {dashboardCharts.map((chart, index) => (
                    <Chart key={index} {...chart} />
                ))}

                {role !== ROLES.CUSTOMER && hasPermission('canViewOrders') && (
                    <div className="task-queue">
                        <h3>Orders in Queue</h3>
                        <div className="task-list">
                            {taskQueueData.length > 0 ? (
                                taskQueueData.map(task => (
                                    <div key={task.id} className={`task-item priority-${task.priority}`} onClick={task.onClick}>
                                        <div className="task-details">
                                            <div className="task-title">{task.title}</div>
                                            <div className="task-meta">{task.meta}</div>
                                        </div>
                                        <span className={`task-status-badge status-${task.status.replace(/\s/g, '-')}`}>{task.status}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state" style={{ padding: varToString('--spacing-md'), boxShadow: 'none' }}>
                                    <span className="icon">{Icons.Check}</span>
                                    <h4>No tasks in your queue!</h4>
                                    <p>Looks like you're all caught up. Keep up the great work!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-widgets">
                <div className="recent-activities-panel">
                    <h3>Recent Activities</h3>
                    {recentActivities.length > 0 ? (
                        recentActivities.map(activity => (
                            <div key={activity.id} className="activity-item">
                                <span className="activity-icon">{activity.status === 'success' ? Icons.Check : activity.status === 'info' ? Icons.Info : Icons.Warning}</span>
                                <div className="activity-content">
                                    <div className="activity-summary">{activity.actor} {activity.type} for {activity.entity}</div>
                                    <div className="activity-time">{formatDate(activity.timestamp)}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" style={{ padding: varToString('--spacing-md'), boxShadow: 'none' }}>
                            <span className="icon">{Icons.Clock}</span>
                            <h4>No recent activity</h4>
                            <p>Stay tuned for updates!</p>
                        </div>
                    )}
                </div>

                <div className="task-queue">
                    <h3>Upcoming Deadlines</h3>
                    {upcomingDeadlines.length > 0 ? (
                        upcomingDeadlines.map(deadline => (
                            <div key={deadline.id} className={`task-item priority-${deadline.status === 'Created' ? 'high' : 'medium'}`} onClick={() => navigateTo('orderDetail', deadline.id)}>
                                <div className="task-details">
                                    <div className="task-title">{deadline.title}</div>
                                    <div className="task-meta">Due: {formatDate(deadline.dueDate.toISOString())}</div>
                                </div>
                                <span className={`task-status-badge status-${deadline.status.replace(/\s/g, '-')}`}>{deadline.status}</span>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" style={{ padding: varToString('--spacing-md'), boxShadow: 'none' }}>
                            <span className="icon">{Icons.Calendar}</span>
                            <h4>No immediate deadlines</h4>
                            <p>All clear for now!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- General List View for Orders, Partners, Rates ---
const GenericListView = ({ type, data, currentUser, hasPermission, navigateTo, showNotification, addAction, exportAction, bulkActions = [], filters = [], savedViews = [] }) => {
    const { role } = currentUser;
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [sortKey, setSortKey] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
    const [currentView, setCurrentView] = useState('All');

    // Role-based filtering for initial data
    const getRoleFilteredData = () => {
        if (type === 'order') {
            if (role === ROLES.CUSTOMER) return data.filter(o => o.customerId === currentUser.id);
            if (role === ROLES.SERVICE_PROVIDER) return data.filter(o => o.serviceProviderId === currentUser.id || !o.serviceProviderId);
        } else if (type === 'partner') {
            if (role === ROLES.CUSTOMER || role === ROLES.SERVICE_PROVIDER) return []; // Customers/SPs don't view partner list
        }
        return data; // Admin sees all or default
    };

    let displayData = getRoleFilteredData();

    // Apply search
    displayData = displayData.filter(item => {
        const searchString = JSON.stringify(item).toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    // Apply filters
    displayData = displayData.filter(item => {
        for (const key in activeFilters) {
            const filterValue = activeFilters[key];
            if (filterValue && filterValue !== 'All') {
                if (key === 'status') {
                    if (item.status !== filterValue) return false;
                } else if (key === 'deliveryOption') {
                    if (item.deliveryOption !== filterValue) return false;
                } else if (key === 'partner' && type === 'order') {
                    const partner = DUMMY_DATA.partners.find(p => p.name === filterValue);
                    if (item.serviceProviderId !== (partner ? partner.id : null)) return false;
                } else if (key === 'date') {
                    const itemDate = new Date(item.createdAt || item.updatedAt);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const last7Days = new Date(today);
                    last7Days.setDate(today.getDate() - 6);
                    if (filterValue === 'Today' && itemDate < today) return false;
                    if (filterValue === 'Yesterday' && (itemDate < yesterday || itemDate >= today)) return false;
                    if (filterValue === 'Last 7 Days' && itemDate < last7Days) return false;
                }
            }
        }
        return true;
    });

    // Apply sort
    displayData.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleFilterChange = (key, value) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSortChange = (key) => {
        if (sortKey === key) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const toggleRecordSelection = (id) => {
        setSelectedRecords(prev =>
            prev.includes(id) ? prev.filter(recId => recId !== id) : [...prev, id]
        );
    };

    const handleBulkAction = (action) => {
        showNotification('info', `Performing bulk action "${action}" on ${selectedRecords.length} records.`);
        setSelectedRecords([]);
    };

    const handleExport = () => {
        showNotification('success', `Exporting ${displayData.length} ${type} records to Excel/PDF.`);
        exportAction && exportAction();
    };

    const commonFilters = [
        { key: 'status', label: 'Status', options: ['All', 'Created', 'Accepted', 'Ironing', 'Ready', 'Delivered', 'Picked', 'Draft', 'Active', 'Inactive', 'SLA Breach'] },
        { key: 'deliveryOption', label: 'Delivery Option', options: ['All', 'Doorstep', 'Customer Pickup'] },
        { key: 'date', label: 'Date', options: ['All', 'Today', 'Yesterday', 'Last 7 Days'] },
    ];
    const adminFilters = [{ key: 'partner', label: 'Partner', options: ['All', ...DUMMY_DATA.partners.map(p => p.name)] }];

    const availableFilters = role === ROLES.ADMIN ? [...commonFilters, ...adminFilters] : commonFilters;

    const renderEmptyState = () => (
        <div className="empty-state">
            <span className="icon">{Icons.Warning}</span>
            <h3>No {type}s found</h3>
            <p>Try adjusting your search or filters.</p>
            {addAction && (
                <Button onClick={addAction} variant="primary" icon={Icons.Add}>Create New {type === 'order' ? 'Order' : type === 'partner' ? 'Partner' : 'Rate'}</Button>
            )}
        </div>
    );

    return (
        <div className="fade-in" style={{ padding: varToString('--spacing-xl') }}>
            <div className="list-view-controls">
                <h2>{type === 'order' ? 'Orders' : type === 'partner' ? 'Partners' : 'Rates'}</h2>
                <div style={{ display: 'flex', gap: varToString('--spacing-md') }}>
                    <div className="list-view-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {hasPermission('canExport') && (
                        <Button onClick={handleExport} variant="outline">Export</Button>
                    )}
                    {addAction && (
                        <Button onClick={addAction} variant="primary" icon={Icons.Add}>New</Button>
                    )}
                    <Button onClick={() => setIsFilterPanelOpen(true)} variant="outline" icon={Icons.Filter}>Filter</Button>
                    <Button onClick={() => setIsSortPanelOpen(true)} variant="outline" icon={Icons.Sort}>Sort</Button>
                </div>
            </div>

            {hasPermission('canPerformBulkActions') && selectedRecords.length > 0 && (
                <div className="bulk-actions-bar" style={{ marginBottom: varToString('--spacing-md'), display: 'flex', gap: varToString('--spacing-md'), backgroundColor: varToString('--bg-dark'), padding: varToString('--spacing-md'), borderRadius: varToString('--border-radius-md') }}>
                    <span>{selectedRecords.length} selected</span>
                    {bulkActions.map(action => (
                        <Button key={action.label} onClick={() => handleBulkAction(action.value)} variant="secondary">{action.label}</Button>
                    ))}
                    <Button onClick={() => setSelectedRecords([])} variant="outline" icon={Icons.Close}>Clear Selection</Button>
                </div>
            )}

            <div className="card-grid">
                {displayData.length > 0 ? (
                    displayData.map(item => (
                        <ColorfulCard
                            key={item.id}
                            data={item}
                            onClick={navigateTo}
                            type={type}
                            role={currentUser.id}
                        />
                    ))
                ) : (
                    renderEmptyState()
                )}
            </div>

            {/* Filter Side Panel */}
            {isFilterPanelOpen && (
                <div className="overlay active" onClick={() => setIsFilterPanelOpen(false)}>
                    <div className="side-panel active" onClick={(e) => e.stopPropagation()}>
                        <div className="side-panel-header">
                            <span>Filters</span>
                            <Button onClick={() => setIsFilterPanelOpen(false)} variant="icon">{Icons.Close}</Button>
                        </div>
                        <div className="side-panel-content">
                            {availableFilters.map(filter => (
                                <div key={filter.key} className="filter-group">
                                    <label>{filter.label}</label>
                                    <select
                                        className="form-select"
                                        value={activeFilters[filter.key] || 'All'}
                                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    >
                                        {filter.options.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <div className="side-panel-footer">
                            <Button onClick={() => setActiveFilters({})} variant="outline">Clear Filters</Button>
                            <Button onClick={() => setIsFilterPanelOpen(false)} variant="primary">Apply Filters</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sort Side Panel */}
            {isSortPanelOpen && (
                <div className="overlay active" onClick={() => setIsSortPanelOpen(false)}>
                    <div className="side-panel active" onClick={(e) => e.stopPropagation()}>
                        <div className="side-panel-header">
                            <span>Sort</span>
                            <Button onClick={() => setIsSortPanelOpen(false)} variant="icon">{Icons.Close}</Button>
                        </div>
                        <div className="side-panel-content">
                            <div className="filter-group">
                                <label>Sort By</label>
                                <select
                                    className="form-select"
                                    value={sortKey}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                >
                                    {type === 'order' && (
                                        <>
                                            <option value="createdAt">Created Date</option>
                                            <option value="totalAmount">Total Amount</option>
                                            <option value="status">Status</option>
                                            <option value="customerName">Customer Name</option>
                                        </>
                                    )}
                                    {type === 'partner' && (
                                        <>
                                            <option value="name">Partner Name</option>
                                            <option value="status">Status</option>
                                            <option value="assignedOrders">Assigned Orders</option>
                                        </>
                                    )}
                                    {type === 'rate' && (
                                        <>
                                            <option value="clothType">Cloth Type</option>
                                            <option value="pricePerUnit">Price Per Unit</option>
                                            <option value="status">Status</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Order</label>
                                <select
                                    className="form-select"
                                    value={sortDirection}
                                    onChange={(e) => setSortDirection(e.target.value)}
                                >
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                            </div>
                        </div>
                        <div className="side-panel-footer">
                            <Button onClick={() => { setSortKey('createdAt'); setSortDirection('desc'); setIsSortPanelOpen(false); }} variant="outline">Reset Sort</Button>
                            <Button onClick={() => setIsSortPanelOpen(false)} variant="primary">Apply Sort</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main App Component ---
function App() {
    const { currentUser, currentRole, login, logout, hasPermission, ROLES } = useAuth();
    const [activeScreen, setActiveScreen] = useState('dashboard'); // 'dashboard', 'orderDetail', 'customerOrderForm', 'spOrderUpdateForm', 'adminRateForm', 'adminPartnerForm', 'orders', 'partners', 'rates'
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [orders, setOrders] = useState(DUMMY_DATA.orders);
    const [partners, setPartners] = useState(DUMMY_DATA.partners);
    const [rates, setRates] = useState(DUMMY_DATA.rates);
    const [activities, setActivities] = useState(DUMMY_DATA.activities);
    const [notifications, setNotifications] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationDetails, setConfirmationDetails] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sidebar

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    // Simulate real-time updates and SLA tracking
    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(prevOrders => prevOrders.map(order => ({
                ...order,
                slaStatus: calculateSLAStatus(order.slaDue, order.status),
            })));
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const showNotification = useCallback((type, message) => {
        const id = generateId('notif');
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const dismissNotification = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, exiting: true } : n));
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 300); // Match CSS animation duration
    }, []);

    const navigateTo = useCallback((screen, recordId = null) => {
        setActiveScreen(screen);
        setSelectedRecordId(recordId);
        setIsSidebarOpen(false); // Close sidebar on navigation for mobile
    }, []);

    const goBack = () => {
        if (activeScreen.includes('Form') || activeScreen.includes('Detail')) {
            // Navigate back to the list view or dashboard
            if (activeScreen === 'customerOrderForm' || activeScreen === 'spOrderUpdateForm' || activeScreen === 'adminRateForm' || activeScreen === 'adminPartnerForm') {
                setActiveScreen('dashboard'); // Or the specific list view if available, for simplicity go to dashboard
            } else if (activeScreen === 'orderDetail') {
                setActiveScreen('orders'); // Go back to the orders list
            } else {
                setActiveScreen('dashboard');
            }
        } else {
            setActiveScreen('dashboard');
        }
        setSelectedRecordId(null);
        setShowConfirmation(false);
    };

    const handleSaveOrder = (newOrderData) => {
        setOrders(prevOrders => {
            if (newOrderData.id) {
                // Update existing order
                const updatedOrders = prevOrders.map(o =>
                    o.id === newOrderData.id ? { ...o, ...newOrderData, updatedAt: new Date().toISOString() } : o
                );
                showNotification('success', `Order #${newOrderData.id} updated successfully.`);
                // Update activity log
                setActivities(prev => [...prev, {
                    id: generateId('act'), type: 'Order Updated', entity: newOrderData.id,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: 'info'
                }]);
                return updatedOrders;
            } else {
                // Create new order
                const newId = `ORD${String(++currentOrderId).padStart(3, '0')}`;
                const createdOrder = {
                    ...newOrderData,
                    id: newId,
                    status: 'Created',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    timeline: [{ status: 'Created', timestamp: new Date().toISOString(), actor: currentUser.name }],
                    slaDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours SLA
                    slaStatus: 'Within SLA',
                    documents: [],
                };
                showNotification('success', `Order #${newId} placed successfully.`);
                // Update activity log
                setActivities(prev => [...prev, {
                    id: generateId('act'), type: 'Order Placed', entity: newId,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: 'info'
                }]);
                return [...prevOrders, createdOrder];
            }
        });
        setShowConfirmation(true);
        setConfirmationDetails({
            message: newOrderData.id ? `Order #${newOrderData.id} has been updated!` : 'Your order has been placed successfully!',
            details: newOrderData.id ? 'Changes saved.' : `Your order ID is ${newOrderData.id || `ORD${currentOrderId}`}. We will notify you once it's accepted.`,
            onReturn: () => { setShowConfirmation(false); navigateTo('orders'); },
            onNew: newOrderData.id ? null : () => { setShowConfirmation(false); navigateTo('customerOrderForm'); }
        });
    };

    const handleSaveRate = (newRateData) => {
        setRates(prevRates => {
            if (newRateData.id) {
                const updatedRates = prevRates.map(r => r.id === newRateData.id ? { ...r, ...newRateData } : r);
                showNotification('success', `Rate for ${newRateData.clothType} updated successfully.`);
                setActivities(prev => [...prev, {
                    id: generateId('act'), type: 'Rate Updated', entity: newRateData.clothType,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: 'info'
                }]);
                return updatedRates;
            } else {
                const newId = `rate${++currentRateId}`;
                const createdRate = { ...newRateData, id: newId };
                showNotification('success', `Rate for ${newRateData.clothType} added successfully.`);
                setActivities(prev => [...prev, {
                    id: generateId('act'), type: 'Rate Added', entity: newRateData.clothType,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: 'info'
                }]);
                return [...prevRates, createdRate];
            }
        });
        setShowConfirmation(true);
        setConfirmationDetails({
            message: newRateData.id ? `Rate for ${newRateData.clothType} updated.` : 'New rate added successfully!',
            details: newRateData.id ? 'Changes saved.' : 'The new pricing rule is now active.',
            onReturn: () => { setShowConfirmation(false); navigateTo('rates'); },
            onNew: () => { setShowConfirmation(false); navigateTo('adminRateForm'); }
        });
    };

    const handleSavePartner = (newPartnerData) => {
        setPartners(prevPartners => {
            if (newPartnerData.id.startsWith('partner')) { // Existing partner
                const updatedPartners = prevPartners.map(p => p.id === newPartnerData.id ? { ...p, ...newPartnerData } : p);
                showNotification('success', `Partner ${newPartnerData.name} updated successfully.`);
                setActivities(prev => [...prev, {
                    id: generateId('act'), type: 'Partner Info Updated', entity: newPartnerData.name,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: 'info'
                }]);
                return updatedPartners;
            } else {
                const newId = `partner${++currentPartnerId}`; // Generate a new ID if it's a new partner
                const createdPartner = { ...newPartnerData, id: newId, assignedOrders: 0 };
                showNotification('success', `Partner ${newPartnerData.name} added successfully.`);
                setActivities(prev => [...prev, {
                    id: generateId('act'), type: 'New Partner Onboarded', entity: newPartnerData.name,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: 'success'
                }]);
                return [...prevPartners, createdPartner];
            }
        });
        setShowConfirmation(true);
        setConfirmationDetails({
            message: newPartnerData.id.startsWith('partner') ? `Partner ${newPartnerData.name} updated.` : 'New partner added successfully!',
            details: newPartnerData.id.startsWith('partner') ? 'Partner details saved.' : 'The new service partner is now onboarded.',
            onReturn: () => { setShowConfirmation(false); navigateTo('partners'); },
            onNew: () => { setShowConfirmation(false); navigateTo('adminPartnerForm'); }
        });
    };

    const handleOrderAction = (actionType, orderId, data = {}) => {
        setOrders(prevOrders => {
            const orderIndex = prevOrders.findIndex(o => o.id === orderId);
            if (orderIndex === -1) return prevOrders;

            const updatedOrder = { ...prevOrders[orderIndex] };
            let newStatus = updatedOrder.status;
            let activityType = '';
            let activityStatus = 'info';

            switch (actionType) {
                case 'acceptOrder':
                    newStatus = 'Accepted';
                    updatedOrder.serviceProviderId = currentUser.id;
                    updatedOrder.serviceProviderName = currentUser.name;
                    activityType = 'Order Accepted';
                    activityStatus = 'success';
                    showNotification('success', `Order #${orderId} accepted.`);
                    break;
                case 'markIroning':
                    newStatus = 'Ironing';
                    activityType = 'Order Ironing';
                    activityStatus = 'warning';
                    showNotification('info', `Order #${orderId} is now in ironing process.`);
                    break;
                case 'markReady':
                    newStatus = 'Ready';
                    activityType = 'Order Ready';
                    activityStatus = 'success';
                    showNotification('success', `Order #${orderId} is ready for ${updatedOrder.deliveryOption === 'Doorstep' ? 'delivery' : 'pickup'}.`);
                    break;
                case 'updateDelivery':
                    updatedOrder.deliveryOption = data.deliveryOption;
                    updatedOrder.address = data.address;
                    activityType = 'Delivery Option Updated';
                    activityStatus = 'info';
                    showNotification('info', `Order #${orderId} delivery details updated.`);
                    break;
                case 'updateStatusForm': // This action is triggered from the SP Order Update Form
                    newStatus = data.status;
                    if (data.status === 'Delivered' || data.status === 'Picked') {
                        activityType = `Order ${data.status}`;
                        activityStatus = 'success';
                        showNotification('success', `Order #${orderId} marked as ${data.status}.`);
                        updatedOrder.slaStatus = 'Completed'; // Mark SLA as completed
                        updatedOrder.documents = data.deliveryProof;
                    } else {
                        activityType = `Order Status Changed to ${data.status}`;
                        activityStatus = 'info';
                        showNotification('info', `Order #${orderId} status changed to ${data.status}.`);
                    }
                    break;
                case 'openUpdateForm':
                    navigateTo('spOrderUpdateForm', orderId);
                    return prevOrders; // Don't update here, form handles save
                default:
                    return prevOrders;
            }

            if (newStatus !== updatedOrder.status) {
                updatedOrder.status = newStatus;
                updatedOrder.updatedAt = new Date().toISOString();
                updatedOrder.timeline.push({ status: newStatus, timestamp: new Date().toISOString(), actor: currentUser.name });

                setActivities(prev => [...prev, {
                    id: generateId('act'), type: activityType, entity: orderId,
                    role: currentRole, actor: currentUser.name, timestamp: new Date().toISOString(), status: activityStatus
                }]);
            }

            const newOrders = [...prevOrders];
            newOrders[orderIndex] = updatedOrder;
            return newOrders;
        });
        if (actionType !== 'openUpdateForm') {
            navigateTo('orderDetail', orderId); // Stay on detail page after action, or go back to list
        }
    };


    const renderContent = () => {
        const selectedOrder = orders.find(o => o.id === selectedRecordId);
        const selectedPartner = partners.find(p => p.id === selectedRecordId);
        const selectedRate = rates.find(r => r.id === selectedRecordId);

        if (showConfirmation) {
            return <FormConfirmation {...confirmationDetails} />;
        }

        switch (activeScreen) {
            case 'dashboard':
                return <Dashboard
                    orders={orders}
                    partners={partners}
                    rates={rates}
                    activities={activities}
                    currentUser={currentUser}
                    hasPermission={hasPermission}
                    navigateTo={navigateTo}
                    showNotification={showNotification}
                />;
            case 'orders':
                return hasPermission('canViewOrders') ? (
                    <GenericListView
                        type="order"
                        data={orders}
                        currentUser={currentUser}
                        hasPermission={hasPermission}
                        navigateTo={(type, id) => navigateTo('orderDetail', id)}
                        showNotification={showNotification}
                        addAction={hasPermission('canCreateOrder') ? () => navigateTo('customerOrderForm') : null}
                        bulkActions={[{ label: 'Bulk Update Status', value: 'updateStatus' }]}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to view orders.</p></div>;
            case 'partners':
                return hasPermission('canViewPartners') ? (
                    <GenericListView
                        type="partner"
                        data={partners}
                        currentUser={currentUser}
                        hasPermission={hasPermission}
                        navigateTo={(type, id) => navigateTo('adminPartnerForm', id)} // Click card to edit partner
                        showNotification={showNotification}
                        addAction={hasPermission('canManagePartners') ? () => navigateTo('adminPartnerForm') : null}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to view partners.</p></div>;
            case 'rates':
                return hasPermission('canViewRates') ? (
                    <GenericListView
                        type="rate"
                        data={rates}
                        currentUser={currentUser}
                        hasPermission={hasPermission}
                        navigateTo={(type, id) => navigateTo('adminRateForm', id)} // Click card to edit rate
                        showNotification={showNotification}
                        addAction={hasPermission('canManageRates') ? () => navigateTo('adminRateForm') : null}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to view rates.</p></div>;
            case 'orderDetail':
                return selectedOrder && hasPermission('canViewOrders') && (currentRole === ROLES.ADMIN || currentUser.id === selectedOrder.customerId || currentUser.id === selectedOrder.serviceProviderId || !selectedOrder.serviceProviderId) ? (
                    <OrderDetailScreen
                        order={selectedOrder}
                        onBack={goBack}
                        onAction={handleOrderAction}
                        currentUser={currentUser}
                        hasPermission={hasPermission}
                    />
                ) : <div className="empty-state"><h3>Order Not Found or Access Denied</h3><p>You do not have permission to view this order or it does not exist.</p></div>;
            case 'customerOrderForm':
                return hasPermission('canCreateOrder') || (hasPermission('canUpdateOrder') && selectedOrder?.customerId === currentUser.id) ? (
                    <CustomerOrderForm
                        order={selectedOrder}
                        onSave={handleSaveOrder}
                        onCancel={goBack}
                        currentUserId={currentUser.id}
                        currentUserName={currentUser.name}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to place or edit orders.</p></div>;
            case 'spOrderUpdateForm':
                return selectedOrder && hasPermission('canUpdateOrder') && (currentRole === ROLES.ADMIN || currentUser.id === selectedOrder.serviceProviderId) ? (
                    <ServiceProviderOrderUpdateForm
                        order={selectedOrder}
                        onSave={(updatedData) => handleOrderAction('updateStatusForm', selectedOrder.id, updatedData)}
                        onCancel={goBack}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to update this order.</p></div>;
            case 'adminRateForm':
                return hasPermission('canManageRates') ? (
                    <AdminRateSetupForm
                        rate={selectedRate}
                        onSave={handleSaveRate}
                        onCancel={goBack}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to manage rates.</p></div>;
            case 'adminPartnerForm':
                return hasPermission('canManagePartners') ? (
                    <AdminPartnerSetupForm
                        partner={selectedPartner}
                        onSave={handleSavePartner}
                        onCancel={goBack}
                    />
                ) : <div className="empty-state"><h3>Access Denied</h3><p>You do not have permission to manage partners.</p></div>;
            default:
                return <div className="empty-state"><h3>Welcome to IronEclipse</h3><p>Please select a dashboard view or action.</p></div>;
        }
    };

    if (!currentUser) {
        return (
            <div className="auth-screen">
                <div className="auth-card">
                    <h2>Login to IronEclipse</h2>
                    <p>Select your role to continue:</p>
                    <div className="role-selection">
                        <Button onClick={() => login(ROLES.ADMIN)} variant="primary">Login as Admin</Button>
                        <Button onClick={() => login(ROLES.SERVICE_PROVIDER)} variant="secondary">Login as Service Provider</Button>
                        <Button onClick={() => login(ROLES.CUSTOMER)} variant="outline">Login as Customer</Button>
                    </div>
                </div>
            </div>
        );
    }

    const isFullScreenActive = activeScreen.includes('Detail') || activeScreen.includes('Form') || showConfirmation;

    return (
        <div className={`app-container ${isFullScreenActive ? 'full-screen-active' : ''}`}>
            {!isFullScreenActive && (
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="logo">{Icons.Iron} IronEclipse</div>
                    <nav className="nav-menu">
                        <div className="nav-item">
                            <a href="#" onClick={() => navigateTo('dashboard')} className={activeScreen === 'dashboard' ? 'nav-link active' : 'nav-link'}>
                                <span className="icon">{Icons.Dashboard}</span> Dashboard
                            </a>
                        </div>
                        {hasPermission('canViewOrders') && (
                            <div className="nav-item">
                                <a href="#" onClick={() => navigateTo('orders')} className={activeScreen === 'orders' || activeScreen.includes('order') ? 'nav-link active' : 'nav-link'}>
                                    <span className="icon">{Icons.Orders}</span> Orders
                                </a>
                            </div>
                        )}
                        {hasPermission('canViewPartners') && (
                            <div className="nav-item">
                                <a href="#" onClick={() => navigateTo('partners')} className={activeScreen === 'partners' || activeScreen.includes('partner') ? 'nav-link active' : 'nav-link'}>
                                    <span className="icon">{Icons.Partners}</span> Partners
                                </a>
                            </div>
                        )}
                        {hasPermission('canViewRates') && (
                            <div className="nav-item">
                                <a href="#" onClick={() => navigateTo('rates')} className={activeScreen === 'rates' || activeScreen.includes('rate') ? 'nav-link active' : 'nav-link'}>
                                    <span className="icon">{Icons.Rates}</span> Rates
                                </a>
                            </div>
                        )}
                    </nav>
                    <div className="logout-section">
                        <a href="#" onClick={logout} className="nav-link">
                            <span className="icon">{Icons.Logout}</span> Logout
                        </a>
                    </div>
                </aside>
            )}

            <header className="header">
                <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)} variant="icon" className="btn-icon toggle-sidebar-btn" style={{ display: isFullScreenActive ? 'none' : 'none' }}>{Icons.Menu}</Button>
                <h2>{activeScreen === 'dashboard' ? `${currentUser.role} Dashboard` :
                    activeScreen === 'orders' ? 'Order Management' :
                    activeScreen === 'partners' ? 'Partner Management' :
                    activeScreen === 'rates' ? 'Rate Management' :
                    activeScreen === 'orderDetail' ? 'Order Details' :
                    activeScreen.includes('Form') ? 'Data Entry Form' : 'IronEclipse'}</h2>
                <div className="header-actions">
                    <div className="search-bar">
                        <input type="text" placeholder="Global Search..." className="search-input" />
                        <span className="search-icon">{Icons.Search}</span>
                    </div>
                    <Button onClick={() => showNotification('info', 'New update available for IronEclipse!')} variant="icon">{Icons.Notification}</Button>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
                        <span className="slider round"></span>
                    </label>
                    <div className="user-profile">
                        <div className="user-avatar">{currentUser.name.split(' ').map(n => n[0]).join('')}</div>
                        <span className="user-name">{currentUser.name}</span>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {renderContent()}
            </main>

            <Notifications notifications={notifications} dismissNotification={dismissNotification} />
        </div>
    );
}

export default function AppWrapper() {
    return (
        <AuthProvider>
            <App />
        </AuthProvider>
    );
}