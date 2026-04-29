import { useEffect, useState } from 'react';
import {
  Table, Badge, Button, Spinner, Alert, Form, Row, Col, InputGroup, Modal,
} from 'react-bootstrap';
import { biensApi } from '../../api/biens.api';
import type { Bien, StatutBien } from '../../types';
import { formatDate, formatPrix, labelStatut, labelTransaction, labelType, statutVariant } from '../../utils/format';

export default function BiensPage() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [filtered, setFiltered] = useState<Bien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');
  const [selectedBien, setSelectedBien] = useState<Bien | null>(null);

  const load = () => {
    setIsLoading(true);
    biensApi.getAll()
      .then((data) => { setBiens(data); setFiltered(data); })
      .catch(() => setError('Impossible de charger les biens.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    let result = biens;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.localisation.ville.toLowerCase().includes(q) ||
          b.localisation.quartier.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((b) => b.type === typeFilter);
    if (statutFilter) result = result.filter((b) => b.statut === statutFilter);
    if (transactionFilter) result = result.filter((b) => b.transaction === transactionFilter);
    setFiltered(result);
  }, [search, typeFilter, statutFilter, transactionFilter, biens]);

  const handleStatutChange = async (id: number, statut: StatutBien) => {
    try {
      const updated = await biensApi.updateStatut(id, statut);
      setBiens((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch {
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Biens immobiliers</h4>
        <Badge bg="secondary" pill className="fs-6">{filtered.length}</Badge>
      </div>

      <Row className="g-2 mb-3">
        <Col xs={12} md={4}>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Ville, quartier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col xs={6} md={2}>
          <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Tous types</option>
            <option value="maison">Maison</option>
            <option value="appart_vide">Appart. vide</option>
            <option value="appart_meuble">Appart. meublé</option>
            <option value="guesthouse">Guesthouse</option>
            <option value="terrain">Terrain</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={2}>
          <Form.Select value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)}>
            <option value="">Vente & Location</option>
            <option value="vente">Vente</option>
            <option value="location">Location</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={2}>
          <Form.Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="actif">Actif</option>
            <option value="vendu">Vendu</option>
            <option value="loue">Loué</option>
            <option value="archive">Archivé</option>
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
                <th>Type</th>
                <th>Transaction</th>
                <th>Localisation</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Ajouté le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-4">Aucun résultat</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="text-muted">{b.id}</td>
                    <td>{labelType[b.type]}</td>
                    <td>
                      <Badge bg={b.transaction === 'vente' ? 'danger' : 'info'}>
                        {labelTransaction[b.transaction]}
                      </Badge>
                    </td>
                    <td>
                      <div className="small">{b.localisation.ville}</div>
                      <div className="small text-muted">{b.localisation.quartier}</div>
                    </td>
                    <td className="fw-semibold">{formatPrix(b.prix)}</td>
                    <td>
                      <Badge bg={statutVariant[b.statut]}>
                        {labelStatut[b.statut]}
                      </Badge>
                    </td>
                    <td className="small">{formatDate(b.created_at)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button size="sm" variant="outline-primary" onClick={() => setSelectedBien(b)}>
                          Voir
                        </Button>
                        <Form.Select
                          size="sm"
                          style={{ width: 110 }}
                          value={b.statut}
                          onChange={(e) => handleStatutChange(b.id, e.target.value as StatutBien)}
                        >
                          <option value="actif">Actif</option>
                          <option value="vendu">Vendu</option>
                          <option value="loue">Loué</option>
                          <option value="archive">Archiver</option>
                        </Form.Select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal détail bien */}
      <Modal show={!!selectedBien} onHide={() => setSelectedBien(null)} size="lg">
        {selectedBien && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                {labelType[selectedBien.type]} — {selectedBien.localisation.ville}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Transaction :</strong> {labelTransaction[selectedBien.transaction]}</p>
                  <p><strong>Prix :</strong> {formatPrix(selectedBien.prix)}</p>
                  <p><strong>Statut :</strong> <Badge bg={statutVariant[selectedBien.statut]}>{labelStatut[selectedBien.statut]}</Badge></p>
                  <p><strong>Description :</strong> {selectedBien.description || '—'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Pays :</strong> {selectedBien.localisation.pays}</p>
                  <p><strong>Ville :</strong> {selectedBien.localisation.ville}</p>
                  <p><strong>Quartier :</strong> {selectedBien.localisation.quartier}</p>
                  <p><strong>Adresse :</strong> {selectedBien.localisation.adresse || '—'}</p>
                </Col>
              </Row>
              {selectedBien.photos.length > 0 && (
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {selectedBien.photos.map((p) => (
                    <img
                      key={p.id}
                      src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'}/${p.url}`}
                      alt=""
                      style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ))}
                </div>
              )}
            </Modal.Body>
          </>
        )}
      </Modal>
    </>
  );
}
