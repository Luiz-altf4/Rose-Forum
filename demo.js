// Demo Posts para testar o Roxe Forum
function createDemoPosts() {
    const demoPosts = [
        {
            id: 'demo1',
            title: 'Bem-vindo ao Roxe Forum!',
            content: 'Este é o primeiro post de demonstração no Roxe Forum. Uma comunidade estilo Reddit com visual clássico dos anos 2010. Sinta-se à vontade para explorar as funcionalidades!',
            category: '',
            tags: ['bem-vindo', 'demo', 'roxe'],
            date: new Date(Date.now() - 86400000).toISOString(),
            views: 42,
            likes: 5,
            upvotes: 12,
            downvotes: 0,
            userVote: null,
            author: 'Admin'
        },
        {
            id: 'demo2',
            title: 'Tecnologia: O futuro da programação',
            content: 'A programação está evoluindo rapidamente com novas linguagens e frameworks. O que vocês acham das novas tendências como Rust, Go e WebAssembly? Compartilhem suas experiências!',
            category: 'tecnologia',
            tags: ['programacao', 'tecnologia', 'futuro'],
            date: new Date(Date.now() - 172800000).toISOString(),
            views: 128,
            likes: 15,
            upvotes: 28,
            downvotes: 2,
            userVote: null,
            author: 'TechUser'
        },
        {
            id: 'demo3',
            title: 'Design minimalista: Menos é mais?',
            content: 'O design minimalista tem dominado a web nos últimos anos. Mas será que menos é sempre mais? Discutam os prós e contras dessa abordagem estética.',
            category: 'design',
            tags: ['design', 'minimalismo', 'ux'],
            date: new Date(Date.now() - 259200000).toISOString(),
            views: 89,
            likes: 8,
            upvotes: 18,
            downvotes: 3,
            userVote: null,
            author: 'DesignerPro'
        },
        {
            id: 'demo4',
            title: 'Melhores práticas em JavaScript 2024',
            content: 'Com a evolução do JavaScript, muitas boas práticas surgiram. Async/await, destructuring, modules ES6. Quais técnicas vocês mais usam no dia a dia?',
            category: 'programacao',
            tags: ['javascript', 'programacao', 'web'],
            date: new Date(Date.now() - 345600000).toISOString(),
            views: 156,
            likes: 22,
            upvotes: 35,
            downvotes: 1,
            userVote: null,
            author: 'JSDev'
        },
        {
            id: 'demo5',
            title: 'Livros que todo desenvolvedor deveria ler',
            content: 'Além dos livros técnicos, quais livros de negócios, psicologia ou filosofia influenciaram sua carreira? Eu recomendo "The Pragmatic Programmer" e "Clean Code".',
            category: 'livros',
            tags: ['livros', 'desenvolvimento', 'carreira'],
            date: new Date(Date.now() - 432000000).toISOString(),
            views: 203,
            likes: 31,
            upvotes: 45,
            downvotes: 4,
            userVote: null,
            author: 'BookWorm'
        }
    ];

    // Salvar posts demo apenas se não existirem posts
    const existingPosts = getAllPosts();
    if (existingPosts.length === 0) {
        localStorage.setItem('rose_forum_posts', JSON.stringify(demoPosts));
        console.log('Posts demo criados!');
    }
}

// Criar usuário demo
function createDemoUser() {
    const existingUser = localStorage.getItem('rose_forum_user');
    if (!existingUser) {
        const demoUser = {
            name: 'UsuarioDemo',
            avatar: null,
            joinDate: new Date().toISOString()
        };
        localStorage.setItem('rose_forum_user', JSON.stringify(demoUser));
        console.log('Usuário demo criado!');
    }
}

// Inicializar demo quando carregar a página
document.addEventListener('DOMContentLoaded', function() {
    createDemoUser();
    createDemoPosts();
});
