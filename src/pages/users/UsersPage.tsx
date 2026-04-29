import { useEffect, useState } from 'react';
import {
  Table, Badge, Button, Spinner, Alert, Form, Row, Col, InputGroup,
} from 'react-bootstrap';
import { usersApi } from '../../api/users.api';
import type { User } from '../../types';
import { formatDate, labelRole } from '../../utils/format';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actifFilter, setActifFilter] = useState('');

  const load = () => {
    setIsLoading(true);
    usersApi.getAll()
      .then((data) => { setUsers(data); setFiltered(data); })
      .catch(() => setError('Impossible de charger les utilisateurs.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nom.toLowerCase().includes(q) ||
          u.prenom.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.telephone?.includes(q)
      );
    }
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    if (actifFilter !== '') result = result.filter((u) => String(u.actif) === actifFilter);
    setFiltered(result);
  }, [search, roleFilter, actifFilter, users]);

  const handleToggleActif = async (user: User) => {
    try {
      const updated = await usersApi.toggleActif(user.id, !user.actif);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      alert('Erreur lors de la mise à jour.');
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Utilisateurs</h4>
        <Badge bg="secondary" pill className="fs-6">{filtered.length}</Badge>
      </div>

      <Row className="g-2 mb-3">
        <Col xs={12} md={5}>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col xs={6} md={3}>
          <Form.Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les rôles</option>
            <option value="client">Client</option>
            <option value="detenteur">Détenteur</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={2}>
          <Form.Select value={actifFilter} onChange={(e) => setActifFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </Form.Select>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {isLoading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <div className="table-responsive">
          <Table hover className="bg-white shadow-sm rounded">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Nom complet</th>
                <th>Contact</th>
                <th>Rôle</th>
                <th>Profil</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-4">Aucun résultat</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="text-muted">{u.id}</td>
                    <td>{u.prenom} {u.nom}</td>
                    <td>
                      <div className="small">{u.email || '—'}</div>
                      <div className="small text-muted">{u.telephone || '—'}</div>
                    </td>
                    <td>
                      <Badge bg={u.role === 'detenteur' ? 'primary' : 'secondary'}>
                        {labelRole[u.role]}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={u.profil_complet ? 'success' : 'warning'}>
                        {u.profil_complet ? 'Complet' : 'Incomplet'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={u.actif ? 'success' : 'danger'}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="small">{formatDate(u.created_at)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={u.actif ? 'outline-danger' : 'outline-success'}
                        onClick={() => handleToggleActif(u)}
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
